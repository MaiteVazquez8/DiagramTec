async function findClassesForUser(db, userId) {
  const [rows] = await db.execute(`
    SELECT c.id, c.title, c.description, c.ownerId, c.code,
      CONCAT(u.firstName, ' ', u.lastName) AS ownerName,
      CASE WHEN c.ownerId = ? THEN 0 ELSE 1 END AS joined
    FROM classes c
    LEFT JOIN users u ON u.id = c.ownerId
    LEFT JOIN class_members cm ON cm.classId = c.id AND cm.userId = ?
    WHERE c.ownerId = ? OR cm.userId = ?
    GROUP BY c.id, c.title, c.description, c.ownerId, c.code, u.firstName, u.lastName, c.createdAt
    ORDER BY c.createdAt DESC
  `, [userId, userId, userId, userId]);
  return rows;
}

async function findAvailableClasses(db, userId) {
  // Sin c.code: el código es la "llave" para unirse y no debe listarse a desconocidos.
  const [rows] = await db.execute(`
    SELECT c.id, c.title, c.description, c.ownerId,
      CONCAT(u.firstName, ' ', u.lastName) AS ownerName
    FROM classes c
    LEFT JOIN users u ON u.id = c.ownerId
    WHERE c.id NOT IN (
      SELECT classId FROM class_members WHERE userId = ?
    )
      AND c.ownerId != ?
    ORDER BY c.createdAt DESC
  `, [userId, userId]);
  return rows;
}

async function findClassById(db, classId) {
  const [rows] = await db.execute(`
    SELECT c.id, c.title, c.description, c.ownerId, c.code,
      CONCAT(u.firstName, ' ', u.lastName) AS ownerName
    FROM classes c LEFT JOIN users u ON u.id = c.ownerId
    WHERE c.id = ?
  `, [classId]);
  return rows[0] || null;
}

async function findClassByCode(db, code) {
  const [rows] = await db.execute('SELECT * FROM classes WHERE code = ?', [code.toUpperCase()]);
  return rows[0] || null;
}

async function createClass(db, title, description, code, ownerId) {
  const [result] = await db.execute(
    'INSERT INTO classes (title, description, code, ownerId) VALUES (?, ?, ?, ?)',
    [title, description || '', code, ownerId]
  );
  const [rows] = await db.execute('SELECT id, title, description, code, ownerId FROM classes WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function updateClass(db, classId, title, description) {
  await db.execute(
    'UPDATE classes SET title = ?, description = ? WHERE id = ?',
    [title, description || '', classId]
  );
  return await findClassById(db, classId);
}

async function deleteClass(db, classId) {
  await db.execute('DELETE FROM classes WHERE id = ?', [classId]);
}

async function findMembersForClass(db, classId, userId) {
  const [rows] = await db.execute('SELECT id FROM class_members WHERE classId = ? AND userId = ?', [classId, userId]);
  return rows;
}

async function findStudentMembersByClass(db, classId) {
  const [rows] = await db.execute(`
    SELECT u.id, u.role, u.firstName, u.lastName,
      CONCAT(u.firstName, ' ', u.lastName) AS fullName,
      cm.joinedAt
    FROM class_members cm
    INNER JOIN users u ON u.id = cm.userId
    WHERE cm.classId = ? AND u.role = 'student'
    ORDER BY u.lastName ASC, u.firstName ASC
  `, [classId]);
  return rows;
}

async function joinClass(db, classId, userId) {
  await db.execute('INSERT INTO class_members (classId, userId) VALUES (?, ?)', [classId, userId]);
}

async function leaveClass(db, classId, userId) {
  await db.execute('DELETE FROM class_members WHERE classId = ? AND userId = ?', [classId, userId]);
}

async function findCommentsByClassId(db, classId) {
  const [rows] = await db.execute(`
    SELECT cm.id, cm.content, cm.createdAt,
      CONCAT(u.firstName, ' ', u.lastName) AS authorName, u.id AS authorId, u.role AS authorRole
    FROM comments cm LEFT JOIN users u ON u.id = cm.userId
    WHERE cm.classId = ? ORDER BY cm.createdAt ASC
  `, [classId]);
  return rows;
}

async function insertClassComment(db, classId, userId, content) {
  const [result] = await db.execute(
    'INSERT INTO comments (classId, userId, content) VALUES (?, ?, ?)',
    [classId, userId, content]
  );
  const [rows] = await db.execute(`
    SELECT cm.id, cm.content, cm.createdAt,
      CONCAT(u.firstName, ' ', u.lastName) AS authorName, u.id AS authorId
    FROM comments cm LEFT JOIN users u ON u.id = cm.userId WHERE cm.id = ?
  `, [result.insertId]);
  return rows[0];
}

async function findDesignsByClass(db, classId) {
  const [rows] = await db.execute(`
    SELECT d.id, d.title, d.ownerId, d.classId, d.createdAt, d.isCopy, d.originalId, d.image, d.description,
      (d.pdf_data IS NOT NULL AND d.pdf_data <> '') AS hasPdf,
      CONCAT(u.firstName, ' ', u.lastName) AS ownerName, u.role AS ownerRole
    FROM designs d LEFT JOIN users u ON u.id = d.ownerId
    WHERE d.classId = ? ORDER BY d.createdAt DESC
  `, [classId]);
  return rows;
}

async function findUserRole(db, userId) {
  const [rows] = await db.execute('SELECT id, role FROM users WHERE id = ?', [userId]);
  return rows[0] || null;
}

async function expelMemberFromClass(db, classId, userId) {
  await db.execute('DELETE FROM class_members WHERE classId = ? AND userId = ?', [classId, userId]);
  await db.execute('UPDATE designs SET classId = NULL WHERE classId = ? AND ownerId = ?', [classId, userId]);
  await db.execute('DELETE FROM comments WHERE classId = ? AND userId = ?', [classId, userId]);
}

module.exports = {
  findClassesForUser,
  findAvailableClasses,
  findClassById,
  findClassByCode,
  createClass,
  updateClass,
  deleteClass,
  findMembersForClass,
  findStudentMembersByClass,
  joinClass,
  leaveClass,
  findCommentsByClassId,
  insertClassComment,
  findDesignsByClass,
  findUserRole,
  expelMemberFromClass
};