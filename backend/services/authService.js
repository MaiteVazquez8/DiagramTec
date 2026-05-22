const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findByEmail, createUser, findById, updateUser } = require('../repositories/userRepository');

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

module.exports = { 
    register, 
    login, 
    getMe, 
    updateProfile 
};