async function countUsers(db) {
  const [[row]] = await db.execute('SELECT COUNT(*) AS totalUsers FROM users');
  return row.totalUsers;
}

async function countClasses(db) {
  const [[row]] = await db.execute('SELECT COUNT(*) AS totalClasses FROM classes');
  return row.totalClasses;
}

async function countDesigns(db) {
  const [[row]] = await db.execute('SELECT COUNT(*) AS totalDesigns FROM designs');
  return row.totalDesigns;
}

async function listUsers(db) {
  const [rows] = await db.execute('SELECT id, firstName, lastName, email, role, createdAt FROM users ORDER BY createdAt DESC');
  return rows;
}

async function listTeachers(db) {
  const [rows] = await db.execute(`
    SELECT DISTINCT u.id, u.firstName, u.lastName, u.email, u.role, u.createdAt
    FROM users u
    LEFT JOIN classes c ON c.ownerId = u.id
    WHERE u.role = 'teacher' OR c.id IS NOT NULL
    ORDER BY u.createdAt DESC
  `);
  return rows;
}

async function listStudents(db) {
  const [rows] = await db.execute(`
    SELECT u.id, u.firstName, u.lastName, u.email, u.role, u.createdAt
    FROM users u
    WHERE u.role = 'student'
      AND u.id NOT IN (
        SELECT DISTINCT c.ownerId FROM classes c WHERE c.ownerId IS NOT NULL
      )
    ORDER BY u.createdAt DESC
  `);
  return rows;
}

async function updateUser(db, id, firstName, lastName, email, role) {
  const allowedRoles = ['student', 'teacher', 'admin', 'superadmin'];
  const safeRole = allowedRoles.includes(role) ? role : 'student';
  await db.execute(
    'UPDATE users SET firstName = ?, lastName = ?, email = ?, role = ? WHERE id = ?',
    [firstName, lastName, email.toLowerCase(), safeRole, id],
  );
  const [rows] = await db.execute('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [id]);
  return rows[0];
}

async function deleteUser(db, id) {
  await db.execute('DELETE FROM users WHERE id = ?', [id]);
}

async function listClasses(db) {
  const [rows] = await db.execute(`
    SELECT c.id, c.title, c.description, c.code, c.createdAt,
      CONCAT(u.firstName, ' ', u.lastName) AS ownerName,
      (
        SELECT COUNT(*)
        FROM class_members cm
        INNER JOIN users us ON us.id = cm.userId AND us.role = 'student'
        WHERE cm.classId = c.id
      ) AS studentCount
    FROM classes c
    LEFT JOIN users u ON u.id = c.ownerId
    ORDER BY c.createdAt DESC
  `);
  return rows;
}

async function deleteClass(db, id) {
  await db.execute('DELETE FROM classes WHERE id = ?', [id]);
}

module.exports = {
  countUsers,
  countClasses,
  countDesigns,
  listUsers,
  listTeachers,
  listStudents,
  updateUser,
  deleteUser,
  listClasses,
  deleteClass
};