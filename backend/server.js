require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { openDb, initDb, generateClassCode } = require('./db');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 4002;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let db;

async function startServer() {
  try {
    db = await openDb();
    await initDb(db);
    console.log('Database connected and initialized');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

startServer();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// === HEALTH ===
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// === AUTH ===
app.post('/auth/register', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  const userRole = ['student', 'teacher'].includes(role) ? role : 'student';
  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (firstName, lastName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, email.toLowerCase(), hash, userRole]
    );
    const token = jwt.sign({ id: result.insertId, role: userRole }, JWT_SECRET, { expiresIn: '48h' });
    res.json({ token, user: { id: result.insertId, firstName, lastName, email: email.toLowerCase(), role: userRole } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '48h' });
    res.json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/auth/me', authMiddleware, async (req, res) => {
  const { firstName, lastName, email } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase(), req.user.id]);
    if (existing.length > 0) return res.status(400).json({ error: 'El correo ya está en uso' });
    await db.execute('UPDATE users SET firstName = ?, lastName = ?, email = ? WHERE id = ?', [firstName, lastName, email.toLowerCase(), req.user.id]);
    const [rows] = await db.execute('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// === CLASSES ===
app.get('/classes', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.id, c.title, c.description, c.ownerId, c.code,
        CONCAT(u.firstName, ' ', u.lastName) AS ownerName,
        1 AS joined
      FROM classes c
      LEFT JOIN users u ON u.id = c.ownerId
      INNER JOIN class_members cm ON cm.classId = c.id AND cm.userId = ?
      UNION
      SELECT c.id, c.title, c.description, c.ownerId, c.code,
        CONCAT(u.firstName, ' ', u.lastName) AS ownerName,
        0 AS joined
      FROM classes c
      LEFT JOIN users u ON u.id = c.ownerId
      WHERE c.ownerId = ?
    `, [req.user.id, req.user.id]);
    res.json({ classes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/classes/available', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.id, c.title, c.description, c.ownerId, c.code,
        CONCAT(u.firstName, ' ', u.lastName) AS ownerName
      FROM classes c
      LEFT JOIN users u ON u.id = c.ownerId
      INNER JOIN class_members cm ON cm.classId = c.id AND cm.userId = ?
    `, [req.user.id]);
    res.json({ classes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/classes', authMiddleware, async (req, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Solo profesores pueden crear clases' });
  }
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'El nombre de la clase es obligatorio' });
  try {
    let code, existing, attempts = 0;
    do {
      code = generateClassCode();
      attempts++;
      if (attempts > 10) return res.status(500).json({ error: 'Error generando código único' });
      [existing] = await db.execute('SELECT id FROM classes WHERE code = ?', [code]);
    } while (existing.length > 0);
    const [result] = await db.execute(
      'INSERT INTO classes (title, description, code, ownerId) VALUES (?, ?, ?, ?)',
      [title, description || '', code, req.user.id]
    );
    const [rows] = await db.execute('SELECT id, title, description, code, ownerId FROM classes WHERE id = ?', [result.insertId]);
    res.json({ class: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/classes/:id', authMiddleware, async (req, res) => {
  const classId = Number(req.params.id);
  try {
    const [classRows] = await db.execute(`
      SELECT c.id, c.title, c.description, c.ownerId, c.code,
        CONCAT(u.firstName, ' ', u.lastName) AS ownerName
      FROM classes c LEFT JOIN users u ON u.id = c.ownerId
      WHERE c.id = ?
    `, [classId]);
    if (!classRows[0]) return res.status(404).json({ error: 'Clase no encontrada' });
    const [commentsRows] = await db.execute(`
      SELECT cm.id, cm.content, cm.createdAt,
        CONCAT(u.firstName, ' ', u.lastName) AS authorName, u.id AS authorId
      FROM comments cm LEFT JOIN users u ON u.id = cm.userId
      WHERE cm.classId = ? ORDER BY cm.createdAt ASC
    `, [classId]);
    res.json({ class: classRows[0], comments: commentsRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/classes/:id', authMiddleware, async (req, res) => {
  const classId = Number(req.params.id);
  try {
    const [rows] = await db.execute('SELECT * FROM classes WHERE id = ?', [classId]);
    const classRow = rows[0];
    if (!classRow) return res.status(404).json({ error: 'Clase no encontrada' });
    if (classRow.ownerId !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    await db.execute('DELETE FROM classes WHERE id = ?', [classId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/classes/join', authMiddleware, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código de clase obligatorio' });
  try {
    const [classRows] = await db.execute('SELECT * FROM classes WHERE code = ?', [code.toUpperCase()]);
    const classRow = classRows[0];
    if (!classRow) return res.status(404).json({ error: 'Clase no encontrada' });
    const [existing] = await db.execute('SELECT id FROM class_members WHERE classId = ? AND userId = ?', [classRow.id, req.user.id]);
    if (existing.length > 0) return res.json({ joined: true, class: { id: classRow.id, title: classRow.title } });
    await db.execute('INSERT INTO class_members (classId, userId) VALUES (?, ?)', [classRow.id, req.user.id]);
    res.json({ joined: true, class: { id: classRow.id, title: classRow.title } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/classes/leave', authMiddleware, async (req, res) => {
  const { classId } = req.body;
  try {
    await db.execute('DELETE FROM class_members WHERE classId = ? AND userId = ?', [classId, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/classes/:id/designs', authMiddleware, async (req, res) => {
  const classId = Number(req.params.id);
  try {
    const [classRows] = await db.execute('SELECT * FROM classes WHERE id = ?', [classId]);
    const classRow = classRows[0];
    if (!classRow) return res.status(404).json({ error: 'Clase no encontrada' });
    const [memberRows] = await db.execute('SELECT id FROM class_members WHERE classId = ? AND userId = ?', [classId, req.user.id]);
    if (memberRows.length === 0 && classRow.ownerId !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const [rows] = await db.execute(`
      SELECT d.id, d.title, d.ownerId, d.classId, d.createdAt, d.isCopy, d.originalId, d.image, d.pdf_data, d.description,
        CONCAT(u.firstName, ' ', u.lastName) AS ownerName
      FROM designs d LEFT JOIN users u ON u.id = d.ownerId
      WHERE d.classId = ? ORDER BY d.createdAt DESC
    `, [classId]);
    const [comments] = await db.execute(`
      SELECT cm.id, cm.content, cm.createdAt, cm.userId,
        CONCAT(u.firstName, ' ', u.lastName) AS authorName, u.role AS authorRole
      FROM comments cm LEFT JOIN users u ON u.id = cm.userId
      WHERE cm.classId = ? ORDER BY cm.createdAt ASC
    `, [classId]);
    res.json({ designs: rows, comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/classes/:id/comments', authMiddleware, async (req, res) => {
  const classId = Number(req.params.id);
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'El contenido es obligatorio' });
  try {
    const [result] = await db.execute(
      'INSERT INTO comments (classId, userId, content) VALUES (?, ?, ?)',
      [classId, req.user.id, content]
    );
    const [rows] = await db.execute(`
      SELECT cm.id, cm.content, cm.createdAt,
        CONCAT(u.firstName, ' ', u.lastName) AS authorName, u.id AS authorId
      FROM comments cm LEFT JOIN users u ON u.id = cm.userId WHERE cm.id = ?
    `, [result.insertId]);
    res.json({ comment: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/comments/:id', authMiddleware, async (req, res) => {
  const commentId = Number(req.params.id);
  try {
    const [rows] = await db.execute('SELECT * FROM comments WHERE id = ?', [commentId]);
    const comment = rows[0];
    if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (comment.userId !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    await db.execute('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// === DESIGNS ===
app.get('/designs', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.id, d.title, d.ownerId, d.classId, d.createdAt, d.isCopy, d.originalId, d.image, d.pdf_data, d.description,
        CONCAT(u.firstName, ' ', u.lastName) AS ownerName
      FROM designs d LEFT JOIN users u ON u.id = d.ownerId
      WHERE d.ownerId = ? ORDER BY d.createdAt DESC
    `, [req.user.id]);
    res.json({ designs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/designs/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [rows] = await db.execute(`
      SELECT d.*, CONCAT(u.firstName, ' ', u.lastName) AS ownerName
      FROM designs d LEFT JOIN users u ON u.id = d.ownerId WHERE d.id = ?
    `, [id]);
    const design = rows[0];
    if (!design) return res.status(404).json({ error: 'Diseño no encontrado' });
    if (design.ownerId !== req.user.id && req.user.role !== 'superadmin') {
      if (design.classId) {
        const [memberRows] = await db.execute('SELECT id FROM class_members WHERE classId = ? AND userId = ?', [design.classId, req.user.id]);
        if (memberRows.length === 0) return res.status(403).json({ error: 'No autorizado' });
      } else {
        return res.status(403).json({ error: 'No autorizado' });
      }
    }
    res.json({ design });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/designs', authMiddleware, async (req, res) => {
  const { title, content, classId, image, pdf_data, description } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Título y contenido son obligatorios' });
  try {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const [result] = await db.execute(
      'INSERT INTO designs (title, ownerId, classId, content, image, pdf_data, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, req.user.id, classId || null, contentStr, image || null, pdf_data || null, description || null]
    );
    const [rows] = await db.execute('SELECT * FROM designs WHERE id = ?', [result.insertId]);
    res.json({ design: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/designs/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { title, content, classId, image, pdf_data, description } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM designs WHERE id = ?', [id]);
    const design = rows[0];
    if (!design) return res.status(404).json({ error: 'Diseño no encontrado' });
    if (design.ownerId !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
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
    res.json({ design: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/designs/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [rows] = await db.execute('SELECT * FROM designs WHERE id = ?', [id]);
    const design = rows[0];
    if (!design) return res.status(404).json({ error: 'Diseño no encontrado' });
    if (design.ownerId !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    await db.execute('DELETE FROM designs WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/designs/:id/copy', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [rows] = await db.execute('SELECT * FROM designs WHERE id = ?', [id]);
    const design = rows[0];
    if (!design) return res.status(404).json({ error: 'Diseño no encontrado' });
    const [result] = await db.execute(
      'INSERT INTO designs (title, ownerId, classId, content, isCopy, originalId) VALUES (?, ?, ?, ?, ?, ?)',
      [`${design.title} (copia)`, req.user.id, null, design.content, true, design.id]
    );
    const [copied] = await db.execute('SELECT * FROM designs WHERE id = ?', [result.insertId]);
    res.json({ design: copied[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// === ADMIN ===
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso solo para super administradores' });
  }
  next();
}

app.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.execute('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalClasses }]] = await db.execute('SELECT COUNT(*) AS totalClasses FROM classes');
    const [[{ totalDesigns }]] = await db.execute('SELECT COUNT(*) AS totalDesigns FROM designs');
    res.json({ totalUsers, totalClasses, totalDesigns });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, firstName, lastName, email, role, createdAt FROM users ORDER BY createdAt DESC');
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { firstName, lastName, email, role } = req.body;
  try {
    await db.execute('UPDATE users SET firstName = ?, lastName = ?, email = ?, role = ? WHERE id = ?',
      [firstName, lastName, email, role, id]);
    const [rows] = await db.execute('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [id]);
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  try {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/admin/classes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT c.id, c.title, c.description, c.code, c.createdAt,
        CONCAT(u.firstName, ' ', u.lastName) AS ownerName
      FROM classes c LEFT JOIN users u ON u.id = c.ownerId
      ORDER BY c.createdAt DESC
    `);
    res.json({ classes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/admin/classes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.execute('DELETE FROM classes WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});