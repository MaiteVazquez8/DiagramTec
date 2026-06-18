/**
 * Genera la carpeta hostinger/dist/ lista para subir a Hostinger Business.
 *
 * Uso:
 *   node scripts/build-hostinger.mjs
 *   HOSTINGER_DOMAIN=midominio.com node scripts/build-hostinger.mjs
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const domain = process.env.HOSTINGER_DOMAIN || 'tudominio.com';
const apiUrl = process.env.VITE_API_URL || `https://api.${domain}`;
const phpUrl = process.env.VITE_PHP_AUTH_URL || `https://${domain}/php`;
const outDir = join(root, 'hostinger', 'dist');
const publicDir = join(outDir, 'public_html');

console.log('DiagramTec — build Hostinger Business');
console.log(`  Dominio:  ${domain}`);
console.log(`  API Node: ${apiUrl}`);
console.log(`  PHP auth: ${phpUrl}`);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });

console.log('\n1/4 Build frontend...');
execSync('pnpm run build', {
  cwd: join(root, 'frontend'),
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_API_URL: apiUrl,
    VITE_PHP_AUTH_URL: phpUrl,
  },
});

console.log('\n2/4 Copiar frontend/dist → public_html...');
cpSync(join(root, 'frontend', 'dist'), publicDir, { recursive: true });

console.log('\n3/4 Copiar php/ → public_html/php...');
const phpDest = join(publicDir, 'php');
cpSync(join(root, 'php'), phpDest, {
  recursive: true,
  filter: (src) => !src.includes('node_modules') && !src.endsWith('.env'),
});

cpSync(join(root, 'hostinger', 'public_html', '.htaccess'), join(publicDir, '.htaccess'));
cpSync(join(root, 'hostinger', 'public_html', 'php', '.user.ini'), join(phpDest, '.user.ini'));

console.log('\n4/4 Preparar backend para Node.js Web App...');
const backendOut = join(outDir, 'nodejs-backend');
cpSync(join(root, 'backend'), backendOut, {
  recursive: true,
  filter: (src) => !src.includes('node_modules') && !src.endsWith('.env'),
});

writeFileSync(
  join(outDir, 'LEEME.txt'),
  [
    'DESPLIEGUE HOSTINGER BUSINESS',
    '=============================',
    '',
    '1. SITIO PRINCIPAL (tudominio.com)',
    '   Sube TODO el contenido de public_html/ a public_html/ en hPanel.',
    '',
    '2. PHP',
    '   Ya va dentro de public_html/php/',
    '   En el servidor: cd public_html/php && composer install --no-dev',
    '   Activa pdo_pgsql en hPanel → PHP Configuration',
    '',
    '3. NODE.JS (api.tudominio.com)',
    '   hPanel → Websites → Add Website → Node.js Web App',
    '   Sube nodejs-backend/ o conecta GitHub (rootDir: backend)',
    '   Entry file: server.js | Start: npm start',
    '   Variables: ver hostinger/node.env.example',
    '',
    '4. SUBDOMINIO api.tudominio.com → app Node.js',
    '',
    '5. SUPABASE: documents/db/supabase.sql + DATABASE_URL',
    '',
    `URLs de este build:`,
    `  API: ${apiUrl}`,
    `  PHP: ${phpUrl}`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`\nListo: ${outDir}`);
console.log('  public_html/      → sitio principal');
console.log('  nodejs-backend/   → Node.js Web App');
console.log('  LEEME.txt         → instrucciones');
