async function countDesignsByOwner(db, ownerId) {
  const [rows] = await db.execute('SELECT COUNT(*) AS count FROM designs WHERE ownerId = ?', [ownerId]);
  return rows[0].count;
}

async function findDesignsByOwner(db, ownerId) {
  const [rows] = await db.execute(`
    SELECT d.id, d.title, d.ownerId, d.classId, d.createdAt, d.isCopy, d.originalId, d.image, d.description,
      (d.pdf_data IS NOT NULL AND d.pdf_data <> '') AS hasPdf,
      CONCAT(u.firstName, ' ', u.lastName) AS ownerName
    FROM designs d LEFT JOIN users u ON u.id = d.ownerId
    WHERE d.ownerId = ? ORDER BY d.createdAt DESC
  `, [ownerId]);
  return rows;
}

// Las listas y el editor no necesitan el PDF (base64 de varios cientos de KB por diseño):
// solo se indica si existe (hasPdf) y se descarga aparte con findDesignPdfById.
async function findDesignById(db, id) {
  const [rows] = await db.execute(`
    SELECT d.id, d.title, d.ownerId, d.classId, d.content, d.image, d.description,
      d.isCopy, d.originalId, d.createdAt,
      (d.pdf_data IS NOT NULL AND d.pdf_data <> '') AS hasPdf,
      CONCAT(u.firstName, ' ', u.lastName) AS ownerName
    FROM designs d LEFT JOIN users u ON u.id = d.ownerId WHERE d.id = ?
  `, [id]);
  return rows[0] || null;
}

/** Solo los campos necesarios para comprobar permisos (sin contenido, imagen ni PDF). */
async function findDesignAccessById(db, id) {
  const [rows] = await db.execute('SELECT id, ownerId, classId FROM designs WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findDesignPdfById(db, id) {
  const [rows] = await db.execute('SELECT pdf_data FROM designs WHERE id = ?', [id]);
  return rows[0]?.pdf_data || null;
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
  findDesignAccessById,
  findDesignPdfById,
  createDesign,
  updateDesign,
  deleteDesign,
  copyDesign
};