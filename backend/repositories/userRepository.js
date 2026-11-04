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

async function deleteUser(db, id) {
  const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * Consultas equivalentes a las de los scripts PHP (sin normalizar el email,
 * tal como se hacía en los formularios PHP).
 */
async function findByEmailAsIs(db, email) {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function createUserAsIs(db, firstName, lastName, email, passwordHash, role) {
  const [result] = await db.execute(
    'INSERT INTO users (firstName, lastName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)',
    [firstName, lastName, email, passwordHash, role]
  );
  return result.insertId;
}

async function setRecoveryToken(db, id, token) {
  const [result] = await db.execute('UPDATE users SET token = ? WHERE id = ?', [token, id]);
  return result.affectedRows > 0;
}

async function findUserByEmailAndToken(db, email, token) {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ? AND token = ?', [email, token]);
  return rows[0] || null;
}

async function resetPassword(db, id, passwordHash, token) {
  const [result] = await db.execute(
    'UPDATE users SET passwordHash = ?, token = ? WHERE id = ?',
    [passwordHash, token, id]
  );
  return result.affectedRows > 0;
}

async function findUserByEmailOrGoogleId(db, email, googleId) {
  const [rows] = await db.execute(
    'SELECT id, firstName, lastName, email, role FROM users WHERE email = ? OR googleId = ?',
    [email, googleId]
  );
  return rows[0] || null;
}

async function setGoogleId(db, id, googleId) {
  await db.execute('UPDATE users SET googleId = ? WHERE id = ?', [googleId, id]);
}

async function createUserWithGoogle(db, firstName, lastName, email, googleId, role) {
  const [result] = await db.execute(
    'INSERT INTO users (firstName, lastName, email, googleId, role) VALUES (?, ?, ?, ?, ?)',
    [firstName, lastName, email, googleId, role]
  );
  return result.insertId;
}

module.exports = {
  findByEmail,
  createUser,
  findById,
  updateUser,
  deleteUser,
  findByEmailAsIs,
  createUserAsIs,
  setRecoveryToken,
  findUserByEmailAndToken,
  resetPassword,
  findUserByEmailOrGoogleId,
  setGoogleId,
  createUserWithGoogle,
};
