const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  findByEmail,
  findByEmailOrGoogleId,
  createUser,
  createGoogleUser,
  setGoogleId,
  findById,
  updateNames,
  deleteUser,
  setResetCode,
  claimResetAttempt,
  updatePassword,
  setVerifyToken,
  consumeVerifyToken,
} = require('../repositories/userRepository');
const { claimInvite, setInviteUser } = require('../repositories/adminRepository');
const { sendMail } = require('./mailService');
const { signToken } = require('../middlewares/auth');

const IS_PROD = process.env.NODE_ENV === 'production';
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
// Hash de relleno: el login tarda lo mismo exista o no el usuario.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

function isStrongPassword(password) {
  // bcrypt ignora lo que pase de 72 bytes.
  return typeof password === 'string' && STRONG_PASSWORD_RE.test(password) && Buffer.byteLength(password) <= 72;
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function publicUser(user) {
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
}

function apiPublicUrl() {
  return (process.env.API_PUBLIC_URL || 'http://localhost:5173/api').replace(/\/$/, '');
}

/** Envía (sin bloquear la respuesta) el enlace para verificar el email o confirmar uno nuevo. */
async function sendVerification(db, user, newEmail = null) {
  const token = crypto.randomBytes(32).toString('hex');
  await setVerifyToken(db, user.id, sha256(token), newEmail);
  const link = `${apiPublicUrl()}/auth/verify-email?token=${token}`;
  const to = newEmail || user.email;
  const subject = newEmail ? 'Confirmá tu nuevo email' : 'Verificá tu email';
  sendMail(
    to,
    `DiagramTec — ${subject}`,
    `<h2>${subject}</h2>
     <p>Para ${newEmail ? 'usar este correo en tu cuenta' : 'activar tu cuenta'} hacé clic en el enlace (vence en 24 horas):</p>
     <p><a href="${link}">${link}</a></p>
     <p>Si no fuiste vos, ignorá este correo.</p>`,
  ).then((sent) => {
    if (!sent && !IS_PROD) console.log(`[verify] Correo no configurado. Enlace para ${to}: ${link}`);
  });
}

async function verifyEmail(db, token) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return null;
  try {
    return await consumeVerifyToken(db, sha256(token));
  } catch (err) {
    if (err.code === '23505') throw new Error('EMAIL_EXISTS'); // el email nuevo ya lo tomó otra cuenta
    throw err;
  }
}

async function resendVerification(db, userId) {
  const user = await findById(db, userId);
  if (!user) throw new Error('USER_NOT_FOUND');
  if (user.emailVerified && !user.pendingEmail) return { message: 'Tu email ya está verificado.' };
  await sendVerification(db, user, user.pendingEmail || null);
  return { message: 'Te enviamos un enlace nuevo. Revisá tu correo.' };
}

async function register(db, userData) {
  const { firstName, lastName, email, password, role, inviteCode } = userData;
  if (!isStrongPassword(password)) throw new Error('PASSWORD_REQUIREMENTS');
  const existing = await findByEmail(db, email);
  if (existing) throw new Error('EMAIL_EXISTS');

  // Profesor solo con un código de invitación vigente (lo genera un superadmin).
  let inviteId = null;
  if (role === 'teacher') {
    const code = String(inviteCode || '').trim().toUpperCase();
    inviteId = /^[0-9A-F]{12}$/.test(code) ? await claimInvite(db, sha256(code)) : null;
    if (!inviteId) throw new Error('INVALID_INVITE');
  }
  const userRole = inviteId ? 'teacher' : 'student';

  const hash = await bcrypt.hash(password, 10);
  const id = await createUser(db, firstName, lastName, email, hash, userRole);
  if (inviteId) await setInviteUser(db, inviteId, id);
  const user = await findById(db, id);
  await sendVerification(db, user);
  return user;
}

async function login(db, email, password) {
  const user = await findByEmail(db, email);
  const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !user.passwordHash || !valid) throw new Error('INVALID_CREDENTIALS');
  return await findById(db, user.id);
}

async function getMe(db, id) {
  return await findById(db, id);
}

/** Si la cuenta tiene contraseña, las acciones sensibles exigen la actual. */
async function assertCurrentPassword(db, userId, currentPassword) {
  const [rows] = await db.execute('SELECT passwordHash FROM users WHERE id = ?', [userId]);
  const hash = rows[0]?.passwordHash;
  if (!hash) return; // cuenta solo-Google: no tiene contraseña que pedir
  if (typeof currentPassword !== 'string' || !currentPassword) throw new Error('CURRENT_PASSWORD_REQUIRED');
  if (!(await bcrypt.compare(currentPassword, hash))) throw new Error('CURRENT_PASSWORD_INVALID');
}

/**
 * Nombre y apellido cambian directo. Cambiar el email o la contraseña exige la contraseña
 * actual; el email nuevo recién se aplica cuando se confirma desde ese correo, y se avisa
 * al email anterior.
 */
async function updateProfile(db, id, data) {
  const current = await findById(db, id);
  if (!current) throw new Error('USER_NOT_FOUND');
  const newEmail = data.email.toLowerCase();
  const emailChanged = newEmail !== current.email.toLowerCase();
  const wantsPassword = typeof data.newPassword === 'string' && data.newPassword.length > 0;

  if (emailChanged || wantsPassword) await assertCurrentPassword(db, id, data.currentPassword);
  if (wantsPassword && !isStrongPassword(data.newPassword)) throw new Error('PASSWORD_REQUIREMENTS');
  if (emailChanged) {
    const taken = await findByEmail(db, newEmail);
    if (taken && Number(taken.id) !== Number(id)) throw new Error('EMAIL_EXISTS');
  }

  let user = await updateNames(db, id, data.firstName, data.lastName);
  const messages = ['Datos actualizados.'];
  if (wantsPassword) {
    await updatePassword(db, id, await bcrypt.hash(data.newPassword, 10));
    messages.push('Contraseña cambiada: se cerraron tus otras sesiones.');
  }
  if (emailChanged) {
    await sendVerification(db, current, newEmail);
    sendMail(
      current.email,
      'DiagramTec — Cambio de email solicitado',
      `<p>Se pidió cambiar el email de tu cuenta a <strong>${newEmail.replace(/[<>&"]/g, '')}</strong>.</p>
       <p>Si no fuiste vos, cambiá tu contraseña ya.</p>`,
    );
    messages.push(`Te enviamos un enlace a ${newEmail} para confirmar el cambio.`);
    user = await findById(db, id);
  }
  return { user, message: messages.join(' '), passwordChanged: wantsPassword };
}

async function deleteAccount(db, id, password) {
  await assertCurrentPassword(db, id, password);
  return await deleteUser(db, id);
}

function hashResetCode(userId, code) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${userId}:${code}`).digest('hex');
}

async function requestRecoveryCode(db, email) {
  const user = await findByEmail(db, email);
  if (!user) return;

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await setResetCode(db, user.id, hashResetCode(user.id, code));

  // Sin await: la respuesta tarda lo mismo exista o no el correo.
  sendMail(
    user.email,
    'Recuperación de contraseña',
    `<h2>Recuperación de contraseña</h2>
     <p>Solicitaste cambiar tu contraseña.</p>
     <p>Tu código de recuperación es:</p>
     <h1>${code}</h1>
     <p>Vence en 15 minutos y es de un solo uso. Si no lo pediste, ignorá este correo.</p>`,
  ).then((sent) => {
    if (!sent) console.error(`[recovery] No se pudo enviar el código al usuario ${user.id}`);
  });
}

async function resetPassword(db, email, code, password) {
  const user = await findByEmail(db, email);
  // Consume un intento solo si hay un código vigente con intentos disponibles.
  const storedHash = user ? await claimResetAttempt(db, user.id) : null;
  const expected = Buffer.from(storedHash || '', 'hex');
  const given = user ? Buffer.from(hashResetCode(user.id, code), 'hex') : Buffer.alloc(0);
  if (!storedHash || expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    throw new Error('INVALID_TOKEN');
  }

  if (user.passwordHash && await bcrypt.compare(password, user.passwordHash)) {
    throw new Error('PASSWORD_SAME_AS_OLD');
  }

  await updatePassword(db, user.id, await bcrypt.hash(password, 10));
  return { message: 'Contraseña actualizada correctamente.' };
}

async function loginOrRegisterWithGoogle(db, profile) {
  const { googleId, email, firstName, lastName } = profile;
  let user = await findByEmailOrGoogleId(db, email, googleId);

  if (user) {
    // La cuenta ya está atada a otra identidad de Google: no se cambia en silencio.
    if (user.googleId && user.googleId !== googleId) throw new Error('GOOGLE_ACCOUNT_MISMATCH');
    if (!user.googleId) {
      await setGoogleId(db, user.id, googleId);
      user = { ...user, googleId };
    }
  } else {
    const id = await createGoogleUser(db, firstName, lastName, email, googleId, 'student');
    user = await findById(db, id);
  }

  return user;
}

module.exports = {
  isStrongPassword,
  signToken,
  publicUser,
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  verifyEmail,
  resendVerification,
  requestRecoveryCode,
  resetPassword,
  loginOrRegisterWithGoogle,
};
