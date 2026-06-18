const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  findByEmail,
  createUser,
  findById,
  updateUser,
  deleteUser,
  setUserToken,
  findByEmailAndToken,
  updatePassword,
} = require('../repositories/userRepository');
const { sendMail } = require('./mailService');

const JWT_SECRET = process.env.JWT_SECRET;

async function register(db, userData) {
  const { firstName, lastName, email, password, role } = userData;
  const existing = await findByEmail(db, email);
  if (existing) throw new Error('EMAIL_EXISTS');
  const hash = await bcrypt.hash(password, 10);
  const userRole = ['student', 'teacher'].includes(role) ? role : 'student';
  const id = await createUser(db, firstName, lastName, email, hash, userRole);
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
  return await updateUser(db, id, data.firstName, data.lastName, data.email);
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

  const user = await findByEmailAndToken(db, email, token);
  if (!user) throw new Error('INVALID_TOKEN');

  const hash = await bcrypt.hash(password, 10);
  const newToken = generateRecoveryCode();
  await updatePassword(db, user.id, hash, newToken);

  return { message: 'Contraseña actualizada correctamente.' };
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  deleteAccount,
  requestRecoveryCode,
  resetPassword,
};
