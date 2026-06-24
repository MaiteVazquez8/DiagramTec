async function countDesignsByOwner(db, ownerId) {
  const [rows] = await db.execute('SELECT COUNT(*) AS count FROM designs WHERE ownerId = ?', [ownerId]);
  return rows[0].count;
}

async function findDesignsByOwner(db, ownerId) {
  const [rows] = await db.execute(`
    SELECT d.id, d.title, d.ownerId, d.classId, d.createdAt, d.isCopy, d.originalId, d.image, d.pdf_data, d.description,
      CONCAT(u.firstName, ' ', u.lastName) AS ownerName
    FROM designs d LEFT JOIN users u ON u.id = d.ownerId
    WHERE d.ownerId = ? ORDER BY d.createdAt DESC
  `, [ownerId]);
  return rows;
}

async function findDesignById(db, id) {
  const [rows] = await db.execute(`
    SELECT d.*, CONCAT(u.firstName, ' ', u.lastName) AS ownerName
    FROM designs d LEFT JOIN users u ON u.id = d.ownerId WHERE d.id = ?
  `, [id]);
  return rows[0] || null;
}

async function createDesign(db, data) {
  const { title, ownerId, classId, content, image, pdf_data, description } = data;
  const [result] = await db.execute(
    'INSERT INTO designs (title, ownerId, classId, content, image, pdf_data, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, ownerId, classId || null, content, image || null, pdf_data || null, description || null]
  );
  const [rows] = await db.execute('SELECT * FROM designs WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function updateDesign(db, id, updates) {
  const [rows] = await db.execute('SELECT * FROM designs WHERE id = ?', [id]);
  const design = rows[0];
  if (!design) return null;
  const { title, content, classId, image, pdf_data, description } = updates;
  const contentStr = content ? (typeof content === 'string' ? content : JSON.stringify(content)) : design.content;
  await db.execute(
    'UPDATE designs SET title = ?, content = ?, classId = ?, image = ?, pdf_data = ?, description = ? WHERE id = ?',
    [
      title || design.title,
      contentStr,
      classId !== undefined ? classId : design.classId,
      image || design.image,
      pdf_data || design.pdf_data,
      description !== undefined ? description : design.description,
      id
    ]
  );
  const [updated] = await db.execute('SELECT * FROM designs WHERE id = ?', [id]);
  return updated[0];
}

async function deleteDesign(db, id) {
  await db.execute('DELETE FROM designs WHERE id = ?', [id]);
}

async function copyDesign(db, id, ownerId) {
  const [rows] = await db.execute('SELECT * FROM designs WHERE id = ?', [id]);
  const design = rows[0];
  if (!design) return null;
  const [result] = await db.execute(
    'INSERT INTO designs (title, ownerId, classId, content, isCopy, originalId) VALUES (?, ?, ?, ?, ?, ?)',
    [`${design.title} (copia)`, ownerId, null, design.content, true, design.id]
  );
  const [copied] = await db.execute('SELECT * FROM designs WHERE id = ?', [result.insertId]);
  return copied[0];
}

module.exports = {
  countDesignsByOwner,
  findDesignsByOwner,
  findDesignById,
  createDesign,
  updateDesign,
  deleteDesign,
  copyDesign
};