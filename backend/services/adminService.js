const adminRepository = require('../repositories/adminRepository');
const { findUserRole } = require('../repositories/classRepository');

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

const ROLES = ['student', 'teacher', 'admin', 'superadmin'];
const PRIVILEGED = ['admin', 'superadmin'];

function isValidText(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

/** Solo un superadmin puede tocar cuentas o roles admin/superadmin. */
async function getManageableTarget(db, id, requester, newRole) {
  const target = await findUserRole(db, id);
  if (!target) throw new Error('USER_NOT_FOUND');
  const touchesPrivileged = PRIVILEGED.includes(target.role) || PRIVILEGED.includes(newRole);
  if (touchesPrivileged && requester.role !== 'superadmin') throw new Error('UNAUTHORIZED');
  return target;
}

async function updateUser(db, id, data, requester) {
  if (!isValidText(data.firstName, 100) || !isValidText(data.lastName, 100) || !isValidText(data.email, 254)) {
    throw new Error('USER_FIELDS_REQUIRED');
  }
  if (data.role !== undefined && !ROLES.includes(data.role)) throw new Error('UNAUTHORIZED');
  const target = await getManageableTarget(db, id, requester, data.role);
  const role = data.role ?? target.role;
  // Nadie se cambia su propio rol (evita quedarse sin superadmin por error).
  if (id === requester.id && role !== target.role) throw new Error('UNAUTHORIZED');
  return await adminRepository.updateUser(
    db,
    id,
    data.firstName.trim(),
    data.lastName.trim(),
    data.email.trim(),
    role,
  );
}

async function deleteUser(db, id, requester) {
  await getManageableTarget(db, id, requester);
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