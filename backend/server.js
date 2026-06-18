require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { openDb } = require('./db');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 4002;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PHP_BACKEND_URL = process.env.PHP_BACKEND_URL || '';
const PHP_EXECUTABLE = process.env.PHP_EXECUTABLE || 'php';
const PHP_HOST = process.env.PHP_HOST || 'localhost';
const PHP_PORT = process.env.PHP_PORT || '8000';
const PHP_ROOT = path.join(__dirname, '..', 'php');
const FRONTEND_URL = process.env.FRONTEND_URL || '';

if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

app.use(cors({
  origin: FRONTEND_URL ? [FRONTEND_URL] : true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

function findPhpInLaragonRoot(laragonRoot) {
  const phpBinDir = path.join(laragonRoot, 'bin', 'php');
  if (!fs.existsSync(phpBinDir)) return null;

  const versions = fs.readdirSync(phpBinDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  for (const version of versions) {
    const exe = path.join(phpBinDir, version, 'php.exe');
    if (fs.existsSync(exe)) return exe;
  }

  return null;
}

function resolvePhpExecutable() {
  let dir = __dirname;
  for (let depth = 0; depth < 8; depth += 1) {
    const exe = findPhpInLaragonRoot(dir);
    if (exe) return exe;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return 'php';
}

function startPhpServer() {
  if (IS_PRODUCTION || PHP_BACKEND_URL) {
    if (PHP_BACKEND_URL) {
      console.log(`Using external PHP backend at ${PHP_BACKEND_URL}`);
    }
    return;
  }

  try {
    const phpExecutable = resolvePhpExecutable() || PHP_EXECUTABLE;
    const php = spawn(phpExecutable, ['-S', `${PHP_HOST}:${PHP_PORT}`, '-t', PHP_ROOT], {
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

    console.log(`PHP built-in server started at http://${PHP_HOST}:${PHP_PORT}`);
  } catch (err) {
    console.error('Failed to start PHP server:', err);
  }
}

async function startServer() {
  try {
    const db = await openDb();
    app.locals.db = db;
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

startPhpServer();
startServer();
