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

async function updateUser(db, id, data) {
  return await adminRepository.updateUser(db, id, data.firstName, data.lastName, data.email, data.role);
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
  updateUser,
  deleteUser,
  listClasses,
  deleteClass
};