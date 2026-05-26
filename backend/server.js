require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { openDb } = require('./db');
const { authMiddleware, adminMiddleware } = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');
const app = express();
const PORT = process.env.PORT || 4002;
const PHP_BACKEND_URL = process.env.PHP_BACKEND_URL || '';
const PHP_EXECUTABLE = process.env.PHP_EXECUTABLE || 'php';
const PHP_HOST = process.env.PHP_HOST || 'localhost';
const PHP_PORT = process.env.PHP_PORT || '8000';
const PHP_ROOT = path.join(__dirname, '..', 'php');
const PHP_BUILTIN_URL = `http://${PHP_HOST}:${PHP_PORT}`;

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


function startPhpServer() {
  if (PHP_BACKEND_URL) {
    console.log(`Using external PHP backend at ${PHP_BACKEND_URL}`);
    return;
  }

  try {
    const php = spawn(PHP_EXECUTABLE, ['-S', `${PHP_HOST}:${PHP_PORT}`, '-t', PHP_ROOT], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    php.on('error', (err) => {
      console.error('Failed to start PHP server:', err.message);
    });

    php.stdout.on('data', (data) => console.log(`[php] ${data.toString().trim()}`));
    php.stderr.on('data', (data) => console.error(`[php][err] ${data.toString().trim()}`));
    php.on('close', (code) => console.log(`PHP server exited with code ${code}`));

    process.on('exit', () => php.kill());
    process.on('SIGINT', () => {
      php.kill();
      process.exit();
    });

    console.log(`PHP built-in server started at ${PHP_BUILTIN_URL}`);
  } catch (err) {
    console.error('Failed to start PHP server:', err);
  }
}

startPhpServer();
startServer();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/php', require('./routes/phpProxy'));
app.use('/php-auth', require('./routes/phpProxy'));
app.use('/auth', require('./routes/auth'));
app.use('/classes', require('./routes/classes'));
app.use('/designs', require('./routes/designs'));
app.use('/comments', require('./routes/comments'));
app.use('/admin', require('./routes/admin'));

app.use(errorHandler);