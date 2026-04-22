require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { openDb, initDb, generateClassCode } = require('./db');

const app = express();
const db = openDb();
initDb(db);
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_to_secure_secret';
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2d' });
}

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/auth/register', (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'El correo ya está registrado' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const insert = db.prepare('INSERT INTO users (firstName, lastName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)');
  const result = insert.run(firstName, lastName, email.toLowerCase(), passwordHash, role === 'teacher' ? 'teacher' : 'student');
  const user = db.prepare('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = createToken(user);
  res.json({ token, user });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(400).json({ error: 'Credenciales inválidas' });
  }

  const safeUser = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
  const token = createToken(safeUser);
  res.json({ token, user: safeUser });
});

app.get('/auth/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json({ user });
});

app.put('/auth/me', authMiddleware, (req, res) => {
  const { firstName, lastName, email } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), req.user.id);
  if (existing) {
    return res.status(400).json({ error: 'El correo ya está en uso' });
  }

  db.prepare('UPDATE users SET firstName = ?, lastName = ?, email = ? WHERE id = ?').run(firstName, lastName, email.toLowerCase(), req.user.id);
  const user = db.prepare('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

app.get('/classes', authMiddleware, (req, res) => {
  const classes = db.prepare(`
    SELECT c.id, c.title, c.description, c.ownerId, u.firstName || ' ' || u.lastName AS ownerName,
      CASE WHEN cm.userId IS NOT NULL THEN 1 ELSE 0 END AS joined
    FROM classes c
    LEFT JOIN users u ON u.id = c.ownerId
    LEFT JOIN class_members cm ON cm.classId = c.id AND cm.userId = ?
  `).all(req.user.id);
  res.json({ classes });
});

app.post('/classes', authMiddleware, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Solo profesores pueden crear clases' });
  }

  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'El nombre de la clase es obligatorio' });
  }

  let code;
  let attempts = 0;
  do {
    code = generateClassCode();
    attempts++;
    if (attempts > 10) {
      return res.status(500).json({ error: 'Error generando código único' });
    }
  } while (db.prepare('SELECT id FROM classes WHERE code = ?').get(code));

  const result = db.prepare('INSERT INTO classes (title, description, code, ownerId) VALUES (?, ?, ?, ?)').run(title, description || '', code, req.user.id);
  const newClass = db.prepare('SELECT id, title, description, code, ownerId FROM classes WHERE id = ?').get(result.lastInsertRowid);
  res.json({ class: newClass });
});

app.post('/classes/join', authMiddleware, (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Código de clase es obligatorio' });
  }

  const classRow = db.prepare('SELECT * FROM classes WHERE code = ?').get(code.toUpperCase());
  if (!classRow) {
    return res.status(404).json({ error: 'Clase no encontrada' });
  }

  const membership = db.prepare('SELECT id FROM class_members WHERE classId = ? AND userId = ?').get(classRow.id, req.user.id);
  if (membership) {
    return res.json({ joined: true, class: { id: classRow.id, title: classRow.title } });
  }

  db.prepare('INSERT INTO class_members (classId, userId) VALUES (?, ?)').run(classRow.id, req.user.id);
  res.json({ joined: true, class: { id: classRow.id, title: classRow.title } });
});

app.get('/classes/:id/designs', authMiddleware, (req, res) => {
  const classId = Number(req.params.id);
  const classRow = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
  if (!classRow) {
    return res.status(404).json({ error: 'Clase no encontrada' });
  }

  const member = db.prepare('SELECT id FROM class_members WHERE classId = ? AND userId = ?').get(classId, req.user.id);
  if (!member && classRow.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'No autorizado para ver diseños de esta clase' });
  }

  const designs = db.prepare(`
    SELECT d.id, d.title, d.ownerId, d.classId, d.createdAt, d.isCopy, d.originalId, u.firstName || ' ' || u.lastName AS ownerName
    FROM designs d
    LEFT JOIN users u ON u.id = d.ownerId
    WHERE d.classId = ?
    ORDER BY d.createdAt DESC
  `).all(classId);
  res.json({ designs });
});

app.get('/designs', authMiddleware, (req, res) => {
  const designs = db.prepare(`
    SELECT d.id, d.title, d.ownerId, d.classId, d.createdAt, d.isCopy, d.originalId,
      u.firstName || ' ' || u.lastName AS ownerName,
      CASE WHEN d.classId IS NOT NULL THEN 1 ELSE 0 END AS isClassDesign
    FROM designs d
    LEFT JOIN users u ON u.id = d.ownerId
    WHERE d.ownerId = ?
      OR d.classId IN (SELECT classId FROM class_members WHERE userId = ?)
    ORDER BY d.createdAt DESC
  `).all(req.user.id, req.user.id);
  res.json({ designs });
});

app.post('/designs', authMiddleware, (req, res) => {
  const { title, content, classId } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });
  }

  if (classId) {
    const classRow = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
    if (!classRow) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    const member = db.prepare('SELECT id FROM class_members WHERE classId = ? AND userId = ?').get(classId, req.user.id);
    if (!member && classRow.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado para guardar en esta clase' });
    }
  }

  const result = db.prepare('INSERT INTO designs (title, ownerId, classId, content) VALUES (?, ?, ?, ?)').run(title, req.user.id, classId || null, JSON.stringify(content));
  const design = db.prepare('SELECT id, title, ownerId, classId, createdAt FROM designs WHERE id = ?').get(result.lastInsertRowid);
  res.json({ design });
});

app.get('/designs/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const design = db.prepare('SELECT * FROM designs WHERE id = ?').get(id);
  if (!design) {
    return res.status(404).json({ error: 'Diseño no encontrado' });
  }

  const userOwns = design.ownerId === req.user.id;
  const joinedClass = design.classId ? db.prepare('SELECT id FROM class_members WHERE classId = ? AND userId = ?').get(design.classId, req.user.id) : null;
  if (!userOwns && !joinedClass && req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'No autorizado para ver este diseño' });
  }

  res.json({ design });
});

app.put('/designs/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const { title, content, classId } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });
  }

  const design = db.prepare('SELECT * FROM designs WHERE id = ?').get(id);
  if (!design) {
    return res.status(404).json({ error: 'Diseño no encontrado' });
  }

  if (design.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'No autorizado para editar este diseño' });
  }

  if (classId) {
    const classRow = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
    if (!classRow) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }
    if (classRow.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado para guardar en esta clase' });
    }
  }

  db.prepare('UPDATE designs SET title = ?, content = ?, classId = ? WHERE id = ?').run(title, JSON.stringify(content), classId || null, id);
  const updatedDesign = db.prepare('SELECT id, title, ownerId, classId, createdAt FROM designs WHERE id = ?').get(id);
  res.json({ design: updatedDesign });
});

app.post('/designs/:id/copy', authMiddleware, (req, res) => {
  if (!original) {
    return res.status(404).json({ error: 'Diseño no encontrado' });
  }

  // Permitir copiar si es propio, o si está en una clase a la que pertenece el usuario
  const userOwns = original.ownerId === req.user.id;
  const joinedClass = original.classId ? db.prepare('SELECT id FROM class_members WHERE classId = ? AND userId = ?').get(original.classId, req.user.id) : null;
  const isTeacher = req.user.role === 'teacher';
  if (!userOwns && !joinedClass && !isTeacher) {
    return res.status(403).json({ error: 'No autorizado para copiar este diseño' });
  }

  const result = db.prepare('INSERT INTO designs (title, ownerId, classId, content, isCopy, originalId) VALUES (?, ?, ?, ?, ?, ?)').run(
    original.title,
    req.user.id,
    null,
    original.content,
    true,
    original.id
  );
  const copy = db.prepare('SELECT id, title, ownerId, classId, createdAt, isCopy, originalId FROM designs WHERE id = ?').get(result.lastInsertRowid);
  res.json({ design: copy });
});

app.get('/classes/available', authMiddleware, (req, res) => {
  const classes = db.prepare('SELECT id, title, description FROM classes WHERE ownerId = ?').all(req.user.id);
  res.json({ classes });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
