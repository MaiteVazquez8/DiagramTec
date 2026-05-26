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

async function updateUser(db, id, firstName, lastName, email, role) {
  await db.execute('UPDATE users SET firstName = ?, lastName = ?, email = ?, role = ? WHERE id = ?', [firstName, lastName, email, role, id]);
  const [rows] = await db.execute('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [id]);
  return rows[0];
}

async function deleteUser(db, id) {
  await db.execute('DELETE FROM users WHERE id = ?', [id]);
}

async function listClasses(db) {
  const [rows] = await db.execute(`
    SELECT c.id, c.title, c.description, c.code, c.createdAt,
      CONCAT(u.firstName, ' ', u.lastName) AS ownerName
    FROM classes c LEFT JOIN users u ON u.id = c.ownerId
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
  updateUser,
  deleteUser,
  listClasses,
  deleteClass
};