require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { openDb } = require('./db');
const errorHandler = require('./middlewares/errorHandler');
const waitForDb = require('./middlewares/waitForDb');
const { securityHeaders } = require('./middlewares/security');

let probeSupabaseConnection = async () => true;
try {
  ({ probeSupabaseConnection } = require('./supabase'));
} catch (err) {
  console.warn('supabase.js no cargado:', err.message);
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || (IS_PRODUCTION ? 3000 : 4002);
const FRONTEND_ORIGINS = (process.env.FRONTEND_URL || '')
  .split(',').map((u) => u.trim().replace(/\/$/, '')).filter(Boolean);

// Sin un secreto fuerte cualquiera puede fabricar tokens de superadmin.
const KNOWN_WEAK_SECRETS = ['nuevaContraseña_superSegura_diagramtec'];
const secret = process.env.JWT_SECRET || '';
if (secret.length < 32 || KNOWN_WEAK_SECRETS.includes(secret)) {
  const msg = 'JWT_SECRET falta o es débil: usá 32+ caracteres aleatorios (node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))")';
  if (IS_PRODUCTION) {
    console.error(`FATAL: ${msg}`);
    process.exit(1);
  }
  console.warn(`WARNING: ${msg}`);
}
if (IS_PRODUCTION && FRONTEND_ORIGINS.length === 0) {
  console.error('FATAL: FRONTEND_URL es obligatorio en producción (CORS).');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
// Saltos de proxy delante de Node: 1 = solo Hostinger; 2 = Cloudflare + Hostinger.
app.set('trust proxy', Number(process.env.TRUST_PROXY || (IS_PRODUCTION ? 1 : 0)));

app.use(securityHeaders);
app.use(cors({
  origin: FRONTEND_ORIGINS.length ? FRONTEND_ORIGINS : false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));
// Los diseños guardan imagen y PDF en base64.
app.use(express.json({ limit: '15mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: app.locals.dbReady ? 'connected' : 'disconnected',
  });
});

const dbGuard = waitForDb();

app.use('/auth', require('./routes/auth'));
app.use('/classes', dbGuard, require('./routes/classes'));
app.use('/designs', dbGuard, require('./routes/designs'));
app.use('/comments', dbGuard, require('./routes/comments'));
app.use('/admin', dbGuard, require('./routes/admin'));

app.use((req, res) => res.status(404).json({ error: 'No encontrado' }));
app.use(errorHandler);

app.locals.dbReady = false;

async function connectDbWithRetry(maxAttempts = 30, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const db = await openDb();
      app.locals.db = db;
      app.locals.dbReady = true;
      console.log(`Database connected (attempt ${attempt})`);
      return;
    } catch (err) {
      console.error(`Database connection failed (${attempt}/${maxAttempts}):`, err.message);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  console.error('Could not connect to database — check DATABASE_URL in hPanel environment variables');
}

console.log('DiagramTec API starting...');
console.log(`  NODE_ENV=${process.env.NODE_ENV || 'development'}`);
console.log(`  PORT=${PORT}`);
console.log(`  DATABASE_URL=${process.env.DATABASE_URL ? 'configured' : 'MISSING'}`);
console.log(`  FRONTEND_URL=${FRONTEND_ORIGINS.join(', ') || '(sin CORS: solo mismo origen / proxy de Vite)'}`);
console.log(`  TURNSTILE=${process.env.TURNSTILE_SECRET ? 'configured' : 'MISSING'}`);

if (IS_PRODUCTION && process.env.PORT === '4002') {
  console.warn('  WARNING: PORT=4002 in env — remove PORT on Hostinger');
}

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection:', err);
});

// Hostinger exige listen() en los primeros 3 segundos — no await antes de esto
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server listen error:', err.message);
});

setImmediate(() => {
  probeSupabaseConnection();
  connectDbWithRetry();
});
