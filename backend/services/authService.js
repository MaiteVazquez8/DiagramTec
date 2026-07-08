const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  findByEmail,
  findByEmailOrGoogleId,
  createUser,
  createGoogleUser,
  setGoogleId,
  findById,
  findByIdWithPassword,
  updateUser,
  updateUserWithPassword,
  deleteUser,
  setUserToken,
  findByEmailAndToken,
  updatePassword,
} = require('../repositories/userRepository');
const { sendMail } = require('./mailService');
const { validateEmail } = require('../utils/emailValidation');
const { validateUserNames } = require('../utils/nameValidation');

const JWT_SECRET = process.env.JWT_SECRET;
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;

async function register(db, userData) {
  const { firstName, lastName, email, password, role } = userData;
  const namesCheck = validateUserNames(firstName, lastName);
  if (!namesCheck.ok) {
    const err = new Error('INVALID_USER_NAME');
    err.clientMessage = namesCheck.error;
    throw err;
  }
  const emailCheck = validateEmail(email);
  if (!emailCheck.ok) {
    const err = new Error('INVALID_EMAIL');
    err.clientMessage = emailCheck.error;
    throw err;
  }
  if (!STRONG_PASSWORD_RE.test(password)) throw new Error('PASSWORD_REQUIREMENTS');
  const existing = await findByEmail(db, emailCheck.email);
  if (existing) throw new Error('EMAIL_EXISTS');
  const hash = await bcrypt.hash(password, 10);
  const userRole = ['student', 'teacher'].includes(role) ? role : 'student';
  const id = await createUser(db, namesCheck.firstName, namesCheck.lastName, emailCheck.email, hash, userRole);
  const token = jwt.sign({ id, role: userRole }, JWT_SECRET, { expiresIn: '48h' });
  const user = await findById(db, id);
  return { token, user };
}

async function login(db, email, password) {
  const user = await findByEmail(db, email);
  if (!user) throw new Error('INVALID_CREDENTIALS');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '48h' });
  return { token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } };
}

async function getMe(db, id) {
  return await findById(db, id);
}

async function updateProfile(db, id, data) {
  const { firstName, lastName, email, password } = data;
  const namesCheck = validateUserNames(firstName, lastName);
  if (!namesCheck.ok) {
    const err = new Error('INVALID_USER_NAME');
    err.clientMessage = namesCheck.error;
    throw err;
  }
  const emailCheck = validateEmail(email);
  if (!emailCheck.ok) {
    const err = new Error('INVALID_EMAIL');
    err.clientMessage = emailCheck.error;
    throw err;
  }

  const current = await findById(db, id);
  if (!current) throw new Error('USER_NOT_FOUND');
  if (emailCheck.email !== current.email.toLowerCase()) {
    const existing = await findByEmail(db, emailCheck.email);
    if (existing && existing.id !== id) throw new Error('EMAIL_EXISTS');
  }

  if (password) {
    if (!STRONG_PASSWORD_RE.test(password)) throw new Error('PASSWORD_REQUIREMENTS');
    const withPassword = await findByIdWithPassword(db, id);
    if (!withPassword) throw new Error('USER_NOT_FOUND');
    if (withPassword.passwordHash && await bcrypt.compare(password, withPassword.passwordHash)) {
      throw new Error('PASSWORD_SAME');
    }
    const hash = await bcrypt.hash(password, 10);
    return updateUserWithPassword(db, id, namesCheck.firstName, namesCheck.lastName, emailCheck.email, hash);
  }

  return updateUser(db, id, namesCheck.firstName, namesCheck.lastName, emailCheck.email);
}

async function deleteAccount(db, id) {
  return await deleteUser(db, id);
}

function generateRecoveryCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestRecoveryCode(db, email) {
  const user = await findByEmail(db, email);
  if (!user) throw new Error('EMAIL_NOT_FOUND');

  const token = generateRecoveryCode();
  await setUserToken(db, user.id, token);

  const sent = await sendMail(
    user.email,
    'Recuperación de contraseña',
    `<h2>Recuperación de contraseña</h2>
     <p>Solicitaste cambiar tu contraseña.</p>
     <p>Tu código de recuperación es:</p>
     <h1>${token}</h1>
     <p>Este código es de un solo uso.</p>`,
  );

  if (!sent) throw new Error('MAIL_FAILED');
  return { message: 'Se envió un código al correo.' };
}

async function resetPassword(db, email, token, password, password2) {
  if (password !== password2) throw new Error('PASSWORD_MISMATCH');
  if (!STRONG_PASSWORD_RE.test(password)) throw new Error('PASSWORD_REQUIREMENTS');

  const emailCheck = validateEmail(email);
  if (!emailCheck.ok) throw new Error('INVALID_EMAIL');

  const user = await findByEmailAndToken(db, emailCheck.email, token);
  if (!user) throw new Error('INVALID_TOKEN');

  if (user.passwordHash && await bcrypt.compare(password, user.passwordHash)) {
    throw new Error('PASSWORD_SAME');
  }

  const hash = await bcrypt.hash(password, 10);
  const newToken = generateRecoveryCode();
  await updatePassword(db, user.id, hash, newToken);

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
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  requestRecoveryCode,
  resetPassword,
  loginOrRegisterWithGoogle,
};
