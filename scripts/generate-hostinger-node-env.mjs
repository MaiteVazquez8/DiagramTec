/**
 * Genera hostinger/nodejs.production.env desde backend/.env (no commitear el output).
 * Uso: node scripts/generate-hostinger-node-env.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
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

let pgPassword = '';
if (vars.DATABASE_URL) {
  try {
    pgPassword = decodeURIComponent(new URL(vars.DATABASE_URL).password);
  } catch {
    pgPassword = 'CAMBIAR';
  }
}

const lines = [
  'NODE_ENV=production',
  '',
  `DATABASE_URL=${vars.DATABASE_URL || ''}`,
  'DB_SSL=true',
  'DB_POOL_MAX=10',
  '',
  'PGHOST=aws-1-us-west-2.pooler.supabase.com',
  'PGUSER=postgres.tyoskyyaetsyqocjzxib',
  `PGPASSWORD=${pgPassword}`,
  'PGDATABASE=postgres',
  'PGPORT=5432',
  '',
  `JWT_SECRET=${vars.JWT_SECRET || ''}`,
  'FRONTEND_URL=https://diagramtec.com',
  'PHP_BACKEND_URL=https://diagramtec.com/php',
  '',
  `EMAIL_USER=${vars.EMAIL_USER || ''}`,
  `EMAIL_PASS=${vars.EMAIL_PASS || ''}`,
  'EMAIL_HOST=smtp.gmail.com',
  'EMAIL_PORT=587',
  'EMAIL_SECURE=false',
  '',
  'SUPABASE_URL=https://tyoskyyaetsyqocjzxib.supabase.co',
];

writeFileSync(out, `${lines.join('\n')}\n`, 'utf8');
console.log(`Generado: ${out}`);
