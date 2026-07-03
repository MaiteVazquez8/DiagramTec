import { readUserFields } from './userFields.js';
import { extractApiError } from './apiError.js';

const silent = { skipErrorToast: true };

function uniqueById(users) {
  const map = new Map();
  for (const user of users) {
    if (user?.id != null) map.set(user.id, user);
  }
  return [...map.values()];
}

export function normalizeUsersList(data) {
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data)) return data;
  return [];
}

export function normalizeClassesList(data) {
  if (Array.isArray(data?.classes)) return data.classes;
  if (Array.isArray(data)) return data;
  return [];
}

export function splitUsersAndClasses(users, classes) {
  const safeUsers = Array.isArray(users) ? users : [];
  const safeClasses = Array.isArray(classes) ? classes : [];
  const ownerIds = new Set(
    safeClasses.map((c) => c.ownerId ?? c.ownerid).filter((id) => id != null),
  );

  const teachers = uniqueById(
    safeUsers.filter((u) => {
      const role = readUserFields(u).role;
      return role === 'teacher' || ownerIds.has(u.id);
    }),
  );
  const teacherIds = new Set(teachers.map((t) => t.id));
  const students = safeUsers.filter((u) => {
    const role = readUserFields(u).role;
    return role === 'student' && !teacherIds.has(u.id);
  });

  return { students, teachers, classes: safeClasses };
}

export async function fetchAdminDashboardData(api) {
  let users = [];
  let classes = [];
  let error = '';

  try {
    const usersRes = await api.get('/admin/users', silent);
    users = normalizeUsersList(usersRes.data);
  } catch (err) {
    error = extractApiError(err);
  }

  try {
    const classesRes = await api.get('/admin/classes', silent);
    classes = normalizeClassesList(classesRes.data);
  } catch (err) {
    error = error || extractApiError(err);
  }

  if (error && users.length === 0 && classes.length === 0) {
    const loadErr = new Error(error);
    loadErr.isAdminLoadError = true;
    throw loadErr;
  }

  const split = splitUsersAndClasses(users, classes);
  return { ...split, loadError: error };
}

export async function fetchAdminStudents(api) {
  const { students } = await fetchAdminDashboardData(api);
  return students;
}

export async function fetchAdminTeachers(api) {
  const { teachers } = await fetchAdminDashboardData(api);
  return teachers;
}

export async function fetchAdminClasses(api) {
  try {
    const res = await api.get('/admin/classes', silent);
    return normalizeClassesList(res.data);
  } catch {
    return [];
  }
}

export function describeAdminLoadError(err) {
  if (err?.isAdminLoadError && err.message) return err.message;
  return extractApiError(err);
}
