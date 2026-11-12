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

// Google ya verificó el email: la cuenta nace verificada.
async function createGoogleUser(db, firstName, lastName, email, googleId, role = 'student') {
  const [result] = await db.execute(
    'INSERT INTO users (firstName, lastName, email, googleId, role, email_verified_at) VALUES (?, ?, ?, ?, ?, now())',
    [firstName, lastName, email.toLowerCase(), googleId, role],
  );
  return result.insertId;
}

/**
 * Vincula Google a una cuenta existente. Como el email de esa cuenta no estaba probado,
 * se borra su contraseña y se cortan sus sesiones: si alguien la había creado con el
 * email de otra persona ("pre-hijacking"), pierde el acceso. El dueño real entra con
 * Google (que verificó el email) y puede volver a definir contraseña con "Olvidé mi contraseña".
 */
async function setGoogleId(db, userId, googleId) {
  await db.execute(
    `UPDATE users SET googleId = ?, passwordHash = NULL, password_changed_at = now(),
       reset_code_hash = NULL, reset_code_expires = NULL, reset_attempts = 0,
       email_verified_at = COALESCE(email_verified_at, now())
     WHERE id = ?`,
    [googleId, userId],
  );
}

async function findById(db, id) {
  const [rows] = await db.execute(
    `SELECT id, firstName, lastName, email, role,
       passwordHash IS NOT NULL AS "hasPassword",
       email_verified_at IS NOT NULL AS "emailVerified",
       pending_email AS "pendingEmail"
     FROM users WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

async function updateNames(db, id, firstName, lastName) {
  await db.execute('UPDATE users SET firstName = ?, lastName = ? WHERE id = ?', [firstName, lastName, id]);
  return findById(db, id);
}

async function deleteUser(db, id) {
  // RETURNING: la capa Postgres devuelve filas (no affectedRows) en los DELETE.
  const [rows] = await db.execute('DELETE FROM users WHERE id = ? RETURNING id', [id]);
  return rows.length > 0;
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

/** Guarda el hash del enlace de verificación (24 h) y, si es un cambio de email, el email nuevo. */
async function setVerifyToken(db, userId, tokenHash, pendingEmail = null) {
  await db.execute(
    `UPDATE users SET verify_token_hash = ?, verify_token_expires = now() + interval '24 hours', pending_email = ?
     WHERE id = ?`,
    [tokenHash, pendingEmail ? pendingEmail.toLowerCase() : null, userId],
  );
}

/**
 * Aplica el enlace: verifica el email o, si había un cambio pendiente, lo aplica.
 * El enlace sigue sirviendo hasta que vence: si un antivirus de correo lo abre antes,
 * el usuario igual ve "verificado" al hacer clic.
 */
async function consumeVerifyToken(db, tokenHash) {
  const [rows] = await db.execute(
    `UPDATE users SET email = COALESCE(pending_email, email), pending_email = NULL,
       email_verified_at = COALESCE(email_verified_at, now())
     WHERE verify_token_hash = ? AND verify_token_expires > now()
     RETURNING id, email`,
    [tokenHash],
  );
  return rows[0] || null;
}

module.exports = {
  findByEmail,
  findByEmailOrGoogleId,
  createUser,
  createGoogleUser,
  setGoogleId,
  findById,
  updateNames,
  deleteUser,
  setResetCode,
  claimResetAttempt,
  updatePassword,
  setVerifyToken,
  consumeVerifyToken,
};
