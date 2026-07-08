const adminRepository = require('../repositories/adminRepository');
const { validateUserNames } = require('../utils/nameValidation');
const { validateEmail } = require('../utils/emailValidation');

async function getStats(db) {
  const totalUsers = await adminRepository.countUsers(db);
  const totalClasses = await adminRepository.countClasses(db);
  const totalDesigns = await adminRepository.countDesigns(db);
  return { totalUsers, totalClasses, totalDesigns };
}

async function listUsers(db) {
  return await adminRepository.listUsers(db);
}

async function listTeachers(db) {
  return await adminRepository.listTeachers(db);
}

async function listStudents(db) {
  return await adminRepository.listStudents(db);
}

async function updateUser(db, id, data) {
  const namesCheck = validateUserNames(data.firstName, data.lastName);
  if (!namesCheck.ok) {
    const err = new Error('INVALID_USER_NAME');
    err.clientMessage = namesCheck.error;
    throw err;
  }
  const emailCheck = validateEmail(data.email);
  if (!emailCheck.ok) {
    const err = new Error('INVALID_EMAIL');
    err.clientMessage = emailCheck.error;
    throw err;
  }
  return await adminRepository.updateUser(
    db,
    id,
    namesCheck.firstName,
    namesCheck.lastName,
    emailCheck.email,
    data.role,
  );
}

async function deleteUser(db, id) {
  return await adminRepository.deleteUser(db, id);
}

async function listClasses(db) {
  return await adminRepository.listClasses(db);
}

async function deleteClass(db, id) {
  return await adminRepository.deleteClass(db, id);
}

module.exports = {
  getStats,
  listUsers,
  listTeachers,
  listStudents,
  updateUser,
  deleteUser,
  listClasses,
  deleteClass
};