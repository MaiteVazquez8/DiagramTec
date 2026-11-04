require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { openDb } = require('./db');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

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
    app.locals.db = db;
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

startServer();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoints heredados del backend PHP (mismos prefijos que el antiguo proxy).
app.use('/php', require('./routes/phpLegacy'));
app.use('/php-auth', require('./routes/phpLegacy'));
app.use('/auth', require('./routes/auth'));
app.use('/classes', require('./routes/classes'));
app.use('/designs', require('./routes/designs'));
app.use('/comments', require('./routes/comments'));
app.use('/admin', require('./routes/admin'));

app.use(errorHandler);
