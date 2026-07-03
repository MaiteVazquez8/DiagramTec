const adminRepository = require('../repositories/adminRepository');

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
  if (!data.firstName?.trim() || !data.lastName?.trim() || !data.email?.trim()) {
    throw new Error('USER_FIELDS_REQUIRED');
  }
  return await adminRepository.updateUser(
    db,
    id,
    data.firstName.trim(),
    data.lastName.trim(),
    data.email.trim(),
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