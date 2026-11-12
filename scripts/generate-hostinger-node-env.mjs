/**
 * Genera hostinger/nodejs.production.env desde backend/.env (no commitear el output).
 * Uso: node scripts/generate-hostinger-node-env.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const backendEnv = join(root, 'backend', '.env');
const out = join(root, 'hostinger', 'nodejs.production.env');

if (!existsSync(backendEnv)) {
  console.error('Falta backend/.env');
  process.exit(1);
}

const vars = {};
for (const line of readFileSync(backendEnv, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const i = t.indexOf('=');
  vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

// Producción nunca usa la clave de prueba de Turnstile ni el secreto JWT de desarrollo.
const isTestTurnstile = (vars.TURNSTILE_SECRET || '').startsWith('1x0000') || (vars.TURNSTILE_SECRET || '').startsWith('2x0000');

const lines = [
  'NODE_ENV=production',
  '# Borrá del panel PGHOST/PGUSER/PGPASSWORD si existen: apuntaban a la base anterior.',
  '',
  `DATABASE_URL=${vars.DATABASE_URL || ''}`,
  'DB_SSL=true',
  'DB_POOL_MAX=10',
  '',
  `JWT_SECRET=${randomBytes(48).toString('base64')}`,
  'FRONTEND_URL=https://diagramtec.qd.je',
  'API_PUBLIC_URL=https://api.diagramtec.qd.je',
  'TRUST_PROXY=1',
  '# Secret del widget de Turnstile de PRODUCCIÓN (Cloudflare → Turnstile). Sin esto el login responde 500.',
  `TURNSTILE_SECRET=${isTestTurnstile ? '' : vars.TURNSTILE_SECRET || ''}`,
  'TURNSTILE_HOSTNAMES=diagramtec.qd.je,www.diagramtec.qd.je',
  `GOOGLE_CLIENT_ID=${vars.GOOGLE_CLIENT_ID || ''}`,
  `GOOGLE_CLIENT_SECRET=${vars.GOOGLE_CLIENT_SECRET || ''}`,
  'GOOGLE_CALLBACK_URL=https://api.diagramtec.qd.je/auth/google/callback',
  '',
  `EMAIL_USER=${vars.EMAIL_USER || ''}`,
  `EMAIL_PASS=${vars.EMAIL_PASS || ''}`,
  'EMAIL_HOST=smtp.gmail.com',
  'EMAIL_PORT=587',
  'EMAIL_SECURE=false',
];

writeFileSync(out, `${lines.join('\n')}\n`, 'utf8');
console.log(`Generado: ${out}`);
