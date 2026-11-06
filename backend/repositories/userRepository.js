async function findByEmail(db, email) {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  return rows[0] || null;
}

async function findByEmailOrGoogleId(db, email, googleId) {
  const [rows] = await db.execute(
    // Si hay dos filas (una por googleId y otra por email) gana la vinculada a Google.
    `SELECT id, firstName, lastName, email, role, googleId FROM users
     WHERE email = ? OR googleId = ? ORDER BY (googleId = ?) DESC NULLS LAST LIMIT 1`,
    [email.toLowerCase(), googleId, googleId],
  );
  return rows[0] || null;
}

async function createUser(db, firstName, lastName, email, passwordHash, role) {
  const [result] = await db.execute(
    'INSERT INTO users (firstName, lastName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)',
    [firstName, lastName, email.toLowerCase(), passwordHash, role]
  );
  return result.insertId;
}

async function createGoogleUser(db, firstName, lastName, email, googleId, role = 'student') {
  const [result] = await db.execute(
    'INSERT INTO users (firstName, lastName, email, googleId, role) VALUES (?, ?, ?, ?, ?)',
    [firstName, lastName, email.toLowerCase(), googleId, role],
  );
  return result.insertId;
}

async function setGoogleId(db, userId, googleId) {
  await db.execute('UPDATE users SET googleId = ? WHERE id = ?', [googleId, userId]);
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

const MAX_RESET_ATTEMPTS = 5;

async function setResetCode(db, userId, codeHash) {
  await db.execute(
    `UPDATE users SET reset_code_hash = ?, reset_code_expires = now() + interval '15 minutes', reset_attempts = 0
     WHERE id = ?`,
    [codeHash, userId],
  );
}

/** Suma un intento de forma atómica y devuelve el hash solo si el código sigue vigente. */
async function claimResetAttempt(db, userId) {
  const [rows] = await db.execute(
    `UPDATE users SET reset_attempts = reset_attempts + 1
     WHERE id = ? AND reset_code_hash IS NOT NULL AND reset_code_expires > now() AND reset_attempts < ${MAX_RESET_ATTEMPTS}
     RETURNING reset_code_hash`,
    [userId],
  );
  return rows[0]?.reset_code_hash || null;
}

async function updatePassword(db, userId, passwordHash) {
  await db.execute(
    `UPDATE users SET passwordHash = ?, password_changed_at = now(),
       reset_code_hash = NULL, reset_code_expires = NULL, reset_attempts = 0
     WHERE id = ?`,
    [passwordHash, userId],
  );
  return true;
}

module.exports = {
  findByEmail,
  findByEmailOrGoogleId,
  createUser,
  createGoogleUser,
  setGoogleId,
  findById,
  updateUser,
  deleteUser,
  setResetCode,
  claimResetAttempt,
  updatePassword,
};
