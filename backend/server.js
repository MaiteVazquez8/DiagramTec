require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { openDb, initDb, generateClassCode } = require('./db');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 4002;

app.use(cors({
  origin: 'http://localhost:5173'
}));

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

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No autorizado'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    req.user = payload;

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Token inválido'
    });
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const [userRows] = await db.execute(
      `
      SELECT 
        id,
        firstName,
        lastName,
        email,
        role
      FROM users
      WHERE id = ?
      `,
      [req.user.id]
    );

    const user = userRows[0];

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      user
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

app.put('/auth/me', authMiddleware, async (req, res) => {
  const { firstName, lastName, email } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      error: 'Faltan datos obligatorios'
    });
  }

  try {
    const [existingRows] = await db.execute(
      `
      SELECT id
      FROM users
      WHERE email = ?
      AND id != ?
      `,
      [email.toLowerCase(), req.user.id]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        error: 'El correo ya está en uso'
      });
    }

    await db.execute(
      `
      UPDATE users
      SET firstName = ?, lastName = ?, email = ?
      WHERE id = ?
      `,
      [
        firstName,
        lastName,
        email.toLowerCase(),
        req.user.id
      ]
    );

    const [userRows] = await db.execute(
      `
      SELECT
        id,
        firstName,
        lastName,
        email,
        role
      FROM users
      WHERE id = ?
      `,
      [req.user.id]
    );

    const user = userRows[0];

    res.json({
      user
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

app.get('/classes', authMiddleware, async (req, res) => {
  try {
    const [classesRows] = await db.execute(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.ownerId,
        c.code,
        CONCAT(u.firstName, ' ', u.lastName) AS ownerName,
        CASE
          WHEN cm.userId IS NOT NULL THEN 1
          ELSE 0
        END AS joined
      FROM classes c
      LEFT JOIN users u
        ON u.id = c.ownerId
      LEFT JOIN class_members cm
        ON cm.classId = c.id
        AND cm.userId = ?
      `,
      [req.user.id]
    );

    res.json({
      classes: classesRows
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

app.post('/classes', authMiddleware, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({
      error: 'Solo profesores pueden crear clases'
    });
  }

  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({
      error: 'El nombre de la clase es obligatorio'
    });
  }

  try {
    let code;
    let existingRows = [];
    let attempts = 0;

    do {
      code = generateClassCode();

      attempts++;

      if (attempts > 10) {
        return res.status(500).json({
          error: 'Error generando código único'
        });
      }

      [existingRows] = await db.execute(
        `
        SELECT id
        FROM classes
        WHERE code = ?
        `,
        [code]
      );

    } while (existingRows.length > 0);

    const [result] = await db.execute(
      `
      INSERT INTO classes (
        title,
        description,
        code,
        ownerId
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        title,
        description || '',
        code,
        req.user.id
      ]
    );

    const [classRows] = await db.execute(
      `
      SELECT
        id,
        title,
        description,
        code,
        ownerId
      FROM classes
      WHERE id = ?
      `,
      [result.insertId]
    );

    res.json({
      class: classRows[0]
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

app.post('/classes/join', authMiddleware, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      error: 'Código de clase obligatorio'
    });
  }

  try {
    const [classRows] = await db.execute(
      `
      SELECT *
      FROM classes
      WHERE code = ?
      `,
      [code.toUpperCase()]
    );

    const classRow = classRows[0];

    if (!classRow) {
      return res.status(404).json({
        error: 'Clase no encontrada'
      });
    }

    const [membershipRows] = await db.execute(
      `
      SELECT id
      FROM class_members
      WHERE classId = ?
      AND userId = ?
      `,
      [classRow.id, req.user.id]
    );

    if (membershipRows.length > 0) {
      return res.json({
        joined: true,
        class: {
          id: classRow.id,
          title: classRow.title
        }
      });
    }

    await db.execute(
      `
      INSERT INTO class_members (
        classId,
        userId
      )
      VALUES (?, ?)
      `,
      [classRow.id, req.user.id]
    );

    res.json({
      joined: true,
      class: {
        id: classRow.id,
        title: classRow.title
      }
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

app.get('/classes/:id/designs', authMiddleware, async (req, res) => {
  const classId = Number(req.params.id);

  try {
    const [classRows] = await db.execute(
      `
      SELECT *
      FROM classes
      WHERE id = ?
      `,
      [classId]
    );

    const classRow = classRows[0];

    if (!classRow) {
      return res.status(404).json({
        error: 'Clase no encontrada'
      });
    }

    const [memberRows] = await db.execute(
      `
      SELECT id
      FROM class_members
      WHERE classId = ?
      AND userId = ?
      `,
      [classId, req.user.id]
    );

    if (
      memberRows.length === 0 &&
      classRow.ownerId !== req.user.id
    ) {
      return res.status(403).json({
        error: 'No autorizado'
      });
    }

    const [designsRows] = await db.execute(
      `
      SELECT
        d.id,
        d.title,
        d.ownerId,
        d.classId,
        d.createdAt,
        d.isCopy,
        d.originalId,
        CONCAT(u.firstName, ' ', u.lastName) AS ownerName
      FROM designs d
      LEFT JOIN users u
        ON u.id = d.ownerId
      WHERE d.classId = ?
      ORDER BY d.createdAt DESC
      `,
      [classId]
    );

    res.json({
      designs: designsRows
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});