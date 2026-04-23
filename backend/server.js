require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { openDb, initDb, generateClassCode } = require('./db');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'change_me_to_secure_secret';
const PORT = process.env.PORT || 4002;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

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

app.post('/auth/register', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const [existingRows] = await db.execute('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const [result] = await db.execute('INSERT INTO users (firstName, lastName, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)', [firstName, lastName, email.toLowerCase(), passwordHash, role === 'teacher' ? 'teacher' : 'student']);
    const [userRows] = await db.execute('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [result.insertId]);
    const user = userRows[0];
    const token = createToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const [userRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = userRows[0];
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const safeUser = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
    const token = createToken(safeUser);
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const [userRows] = await db.execute('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [req.user.id]);
    const user = userRows[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
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
    const [existingRows] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase(), req.user.id]);
    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está en uso' });
    }

    await db.execute('UPDATE users SET firstName = ?, lastName = ?, email = ? WHERE id = ?', [firstName, lastName, email.toLowerCase(), req.user.id]);
    const [userRows] = await db.execute('SELECT id, firstName, lastName, email, role FROM users WHERE id = ?', [req.user.id]);
    const user = userRows[0];
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/classes', authMiddleware, async (req, res) => {
  try {
    const [classesRows] = await db.execute(`
      SELECT c.id, c.title, c.description, c.ownerId, CONCAT(u.firstName, ' ', u.lastName) AS ownerName,
        CASE WHEN cm.userId IS NOT NULL THEN 1 ELSE 0 END AS joined
      FROM classes c
      LEFT JOIN users u ON u.id = c.ownerId
      LEFT JOIN class_members cm ON cm.classId = c.id AND cm.userId = ?
    `, [req.user.id]);
    res.json({ classes: classesRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/classes', authMiddleware, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Solo profesores pueden crear clases' });
  }

  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'El nombre de la clase es obligatorio' });
  }

  try {
    let code;
    let attempts = 0;
    do {
      code = generateClassCode();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({ error: 'Error generando código único' });
      }
      const [existingRows] = await db.execute('SELECT id FROM classes WHERE code = ?', [code]);
    } while (existingRows.length > 0);

    const [result] = await db.execute('INSERT INTO classes (title, description, code, ownerId) VALUES (?, ?, ?, ?)', [title, description || '', code, req.user.id]);
    const [classRows] = await db.execute('SELECT id, title, description, code, ownerId FROM classes WHERE id = ?', [result.insertId]);
    const newClass = classRows[0];
    res.json({ class: newClass });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/classes/join', authMiddleware, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Código de clase es obligatorio' });
  }

  try {
    const [classRows] = await db.execute('SELECT * FROM classes WHERE code = ?', [code.toUpperCase()]);
    const classRow = classRows[0];
    if (!classRow) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    const [membershipRows] = await db.execute('SELECT id FROM class_members WHERE classId = ? AND userId = ?', [classRow.id, req.user.id]);
    if (membershipRows.length > 0) {
      return res.json({ joined: true, class: { id: classRow.id, title: classRow.title } });
    }

    await db.execute('INSERT INTO class_members (classId, userId) VALUES (?, ?)', [classRow.id, req.user.id]);
    res.json({ joined: true, class: { id: classRow.id, title: classRow.title } });
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
    if (!classRow) {
      return res.status(404).json({ error: 'Clase no encontrada' });
    }

    const [memberRows] = await db.execute('SELECT id FROM class_members WHERE classId = ? AND userId = ?', [classId, req.user.id]);
    if (memberRows.length === 0 && classRow.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado para ver diseños de esta clase' });
    }

    const [designsRows] = await db.execute(`
      SELECT d.id, d.title, d.ownerId, d.classId, d.createdAt, d.isCopy, d.originalId, CONCAT(u.firstName, ' ', u.lastName) AS ownerName
      FROM designs d
      LEFT JOIN users u ON u.id = d.ownerId
      WHERE d.classId = ?
      ORDER BY d.createdAt DESC
    `, [classId]);
    res.json({ designs: designsRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/designs', authMiddleware, async (req, res) => {
  try {
    const [designsRows] = await db.execute(`
      SELECT d.id, d.title, d.ownerId, d.classId, d.createdAt, d.isCopy, d.originalId,
        CONCAT(u.firstName, ' ', u.lastName) AS ownerName,
        CASE WHEN d.classId IS NOT NULL THEN 1 ELSE 0 END AS isClassDesign
      FROM designs d
      LEFT JOIN users u ON u.id = d.ownerId
      WHERE d.ownerId = ?
        OR d.classId IN (SELECT classId FROM class_members WHERE userId = ?)
      ORDER BY d.createdAt DESC
    `, [req.user.id, req.user.id]);
    res.json({ designs: designsRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/designs', authMiddleware, async (req, res) => {
  const { title, content, classId } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });
  }

  try {
    if (classId) {
      const [classRows] = await db.execute('SELECT * FROM classes WHERE id = ?', [classId]);
      const classRow = classRows[0];
      if (!classRow) {
        return res.status(404).json({ error: 'Clase no encontrada' });
      }
      const [memberRows] = await db.execute('SELECT id FROM class_members WHERE classId = ? AND userId = ?', [classId, req.user.id]);
      if (memberRows.length === 0 && classRow.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'No autorizado para guardar en esta clase' });
      }
    }

    const [result] = await db.execute('INSERT INTO designs (title, ownerId, classId, content) VALUES (?, ?, ?, ?)', [title, req.user.id, classId || null, JSON.stringify(content)]);
    const [designRows] = await db.execute('SELECT id, title, ownerId, classId, createdAt FROM designs WHERE id = ?', [result.insertId]);
    const design = designRows[0];
    res.json({ design });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/designs/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [designRows] = await db.execute('SELECT * FROM designs WHERE id = ?', [id]);
    const design = designRows[0];
    if (!design) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    const userOwns = design.ownerId === req.user.id;
    let joinedClass = false;
    if (design.classId) {
      const [joinedRows] = await db.execute('SELECT id FROM class_members WHERE classId = ? AND userId = ?', [design.classId, req.user.id]);
      joinedClass = joinedRows.length > 0;
    }
    if (!userOwns && !joinedClass && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'No autorizado para ver este diseño' });
    }

    res.json({ design });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/designs/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { title, content, classId } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });
  }

  try {
    const [designRows] = await db.execute('SELECT * FROM designs WHERE id = ?', [id]);
    const design = designRows[0];
    if (!design) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    if (design.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado para editar este diseño' });
    }

    if (classId) {
      const [classRows] = await db.execute('SELECT * FROM classes WHERE id = ?', [classId]);
      const classRow = classRows[0];
      if (!classRow) {
        return res.status(404).json({ error: 'Clase no encontrada' });
      }
      if (classRow.ownerId !== req.user.id) {
        return res.status(403).json({ error: 'No autorizado para guardar en esta clase' });
      }
    }

    await db.execute('UPDATE designs SET title = ?, content = ?, classId = ? WHERE id = ?', [title, JSON.stringify(content), classId || null, id]);
    const [updatedRows] = await db.execute('SELECT id, title, ownerId, classId, createdAt FROM designs WHERE id = ?', [id]);
    const updatedDesign = updatedRows[0];
    res.json({ design: updatedDesign });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/designs/:id/copy', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [originalRows] = await db.execute('SELECT * FROM designs WHERE id = ?', [id]);
    const original = originalRows[0];
    if (!original) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    // Permitir copiar si es propio, o si está en una clase a la que pertenece el usuario
    const userOwns = original.ownerId === req.user.id;
    let joinedClass = false;
    if (original.classId) {
      const [joinedRows] = await db.execute('SELECT id FROM class_members WHERE classId = ? AND userId = ?', [original.classId, req.user.id]);
      joinedClass = joinedRows.length > 0;
    }
    const isTeacher = req.user.role === 'teacher';
    if (!userOwns && !joinedClass && !isTeacher) {
      return res.status(403).json({ error: 'No autorizado para copiar este diseño' });
    }

    const [result] = await db.execute('INSERT INTO designs (title, ownerId, classId, content, isCopy, originalId) VALUES (?, ?, ?, ?, ?, ?)', [
      original.title,
      req.user.id,
      null,
      original.content,
      true,
      original.id
    ]);
    const [copyRows] = await db.execute('SELECT id, title, ownerId, classId, createdAt, isCopy, originalId FROM designs WHERE id = ?', [result.insertId]);
    const copy = copyRows[0];
    res.json({ design: copy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/classes/available', authMiddleware, async (req, res) => {
  try {
    const [classesRows] = await db.execute('SELECT id, title, description FROM classes WHERE ownerId = ?', [req.user.id]);
    res.json({ classes: classesRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});