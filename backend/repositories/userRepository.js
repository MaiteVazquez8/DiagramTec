async function findByEmail(db, email) {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  return rows[0] || null;
}

async function createUser(db, firstName, lastName, email, passwordHash, role) {
  const [result] = await db.execute(
    'INSERT INTO users (firstName, lastName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)',
    [firstName, lastName, email.toLowerCase(), passwordHash, role]
  );
  return result.insertId;
}

async function findById(db, id) {
  const [rows] = await db.execute('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function updateUser(db, id, firstName, lastName, email) {
  await db.execute('UPDATE users SET firstName = ?, lastName = ?, email = ? WHERE id = ?', [firstName, lastName, email.toLowerCase(), id]);
  return findById(db, id);
}

module.exports = { findByEmail, createUser, findById, updateUser };