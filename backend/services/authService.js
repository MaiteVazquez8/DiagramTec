const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  findByEmail,
  findByEmailOrGoogleId,
  createUser,
  createGoogleUser,
  setGoogleId,
  findById,
  updateUser,
  deleteUser,
  setResetCode,
  claimResetAttempt,
  updatePassword,
} = require('../repositories/userRepository');
const { sendMail } = require('./mailService');
const { signToken } = require('../middlewares/auth');

const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
// Hash de relleno: el login tarda lo mismo exista o no el usuario.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

function isStrongPassword(password) {
  // bcrypt ignora lo que pase de 72 bytes.
  return typeof password === 'string' && STRONG_PASSWORD_RE.test(password) && Buffer.byteLength(password) <= 72;
}

function publicUser(user) {
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
}

async function register(db, userData) {
  const { firstName, lastName, email, password, role } = userData;
  if (!isStrongPassword(password)) throw new Error('PASSWORD_REQUIREMENTS');
  const existing = await findByEmail(db, email);
  if (existing) throw new Error('EMAIL_EXISTS');
  const hash = await bcrypt.hash(password, 10);
  const userRole = ['student', 'teacher'].includes(role) ? role : 'student';
  const id = await createUser(db, firstName, lastName, email, hash, userRole);
  const user = await findById(db, id);
  return { token: signToken(user), user };
}

async function login(db, email, password) {
  const user = await findByEmail(db, email);
  const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !user.passwordHash || !valid) throw new Error('INVALID_CREDENTIALS');
  return { token: signToken(user), user: publicUser(user) };
}

async function getMe(db, id) {
  return await findById(db, id);
}

async function updateProfile(db, id, data) {
  return await updateUser(db, id, data.firstName, data.lastName, data.email);
}

async function deleteAccount(db, id) {
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
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  requestRecoveryCode,
  resetPassword,
  loginOrRegisterWithGoogle,
};
