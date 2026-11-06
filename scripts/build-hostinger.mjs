/**
 * Genera la carpeta hostinger/dist/ lista para subir a Hostinger Business.
 *
 * Uso:
 *   npm run build:hostinger
 *   HOSTINGER_DOMAIN=diagramtec.com npm run build:hostinger
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const siteEnvPath = join(root, 'hostinger', 'site.env');

function loadSiteEnv() {
  try {
    const raw = readFileSync(siteEnvPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...rest] = trimmed.split('=');
      const value = rest.join('=').trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  } catch {
    /* site.env opcional */
  }
}

loadSiteEnv();

const domain = process.env.HOSTINGER_DOMAIN || 'diagramtec.com';
const apiUrl = process.env.VITE_API_URL || `https://api.${domain}`;
const hostingerDir = join(root, 'hostinger');
const outDir = join(hostingerDir, 'dist');
const publicDir = join(outDir, 'public_html');

console.log('DiagramTec — build Hostinger Business');
console.log(`  Dominio:  ${domain}`);
console.log(`  API Node: ${apiUrl}`);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });

console.log('\n1/4 Build frontend...');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
execSync(`${npmCmd} run build`, {
  cwd: join(root, 'frontend'),
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_API_URL: apiUrl,
  },
});

console.log('\n2/4 Copiar frontend/dist → public_html...');
cpSync(join(root, 'frontend', 'dist'), publicDir, { recursive: true });

const frontendSoloDir = join(hostingerDir, 'diagramtec-frontend-solo');
console.log('     Copiar frontend/dist → diagramtec-frontend-solo...');
rmSync(frontendSoloDir, { recursive: true, force: true });
cpSync(join(root, 'frontend', 'dist'), frontendSoloDir, { recursive: true });
cpSync(join(root, 'hostinger', 'public_html', '.htaccess'), join(frontendSoloDir, '.htaccess'));

console.log('\n3/4 Copiar .htaccess (cabeceras de seguridad) → public_html...');
cpSync(join(root, 'hostinger', 'public_html', '.htaccess'), join(publicDir, '.htaccess'));

console.log('\n4/4 Preparar backend para Node.js Web App...');
const backendOut = join(outDir, 'nodejs-backend');
cpSync(join(root, 'backend'), backendOut, {
  recursive: true,
  filter: (src) => !src.includes('node_modules')
    && !src.endsWith('.env')
    && !src.endsWith('pnpm-lock.yaml'),
});
cpSync(join(root, 'hostinger', 'node.env.example'), join(backendOut, '.env.example'));

const backendFilter = (src) => !src.includes('node_modules')
  && !src.endsWith('.env')
  && !src.endsWith('pnpm-lock.yaml');

function copyBackendTo(dest) {
  cpSync(join(root, 'backend'), dest, { recursive: true, filter: backendFilter });
  cpSync(join(root, 'hostinger', 'node.env.example'), join(dest, '.env.example'));
}

function createZip(sourcePath, zipPath, { flat = false } = {}) {
  rmSync(zipPath, { force: true });
  const src = sourcePath.replace(/'/g, "''");
  const dest = zipPath.replace(/'/g, "''");
  if (process.platform === 'win32') {
    const pathArg = flat ? `'${src}\\*'` : `'${src}'`;
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path ${pathArg} -DestinationPath '${dest}' -Force"`,
      { stdio: 'inherit' },
    );
  } else if (flat) {
    execSync(`cd "${sourcePath}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
  } else {
    execSync(`cd "${dirname(sourcePath)}" && zip -r "${zipPath}" "${sourcePath.split('/').pop()}"`, {
      stdio: 'inherit',
    });
  }
}

const fileManagerInstructions = [
  'DIAGRAMTEC — Subir backend Node.js por File Manager',
  '===================================================',
  '',
  'OPCIÓN A — ZIP con carpeta nodejs/ (diagramtec-nodejs-filemanager.zip)',
  '  1. Panel api.diagramtec.com → Gestor de archivos',
  '  2. Andá a la carpeta PADRE de nodejs (domains/api.diagramtec.com/)',
  '  3. Subí el ZIP y extraelo → reemplaza/llena la carpeta nodejs/',
  '',
  'OPCIÓN B — ZIP plano (diagramtec-nodejs-dentro-nodejs.zip)',
  '  1. Entrá DENTRO de la carpeta nodejs/',
  '  2. Borrá archivos viejos (server.js, package.json, etc.)',
  '  3. Subí el ZIP y extraelo aquí (archivos sueltos, sin subcarpeta)',
  '',
  'NO subas nada en la raíz de la cuenta (donde está DO_NOT_UPLOAD_HERE).',
  '',
  'Variables de entorno (hPanel → api.diagramtec.com):',
  '  PGHOST=aws-1-us-west-2.pooler.supabase.com',
  '  PGUSER=postgres.tyoskyyaetsyqocjzxib',
  '  PGPASSWORD=tu_contraseña (con * sin codificar)',
  '  PGDATABASE=postgres  PGPORT=5432  DB_SSL=true',
  '  Sin PORT. Ver node.env.example',
  '',
  'Después: reiniciá la app (Deployments → Redeploy o Restart).',
  '',
].join('\n');

console.log('\n5/5 Crear ZIPs para File Manager...');
const frontendSoloZip = join(hostingerDir, 'diagramtec-frontend-solo.zip');
createZip(frontendSoloDir, frontendSoloZip, { flat: true });

const nodejsWrapped = join(outDir, 'nodejs');
mkdirSync(nodejsWrapped, { recursive: true });
copyBackendTo(nodejsWrapped);
writeFileSync(join(nodejsWrapped, 'LEEME-SUBIR.txt'), fileManagerInstructions, 'utf8');

// ZIP plano: contenido para extraer DENTRO de nodejs/
const flatOut = join(outDir, 'nodejs-flat');
mkdirSync(flatOut, { recursive: true });
copyBackendTo(flatOut);
writeFileSync(join(flatOut, 'LEEME-SUBIR.txt'), fileManagerInstructions, 'utf8');

const backendFlatDir = join(hostingerDir, 'diagramtec-nodejs-dentro-nodejs');
rmSync(backendFlatDir, { recursive: true, force: true });
cpSync(flatOut, backendFlatDir, { recursive: true });

const nodejsDentroZip = join(hostingerDir, 'diagramtec-nodejs-dentro-nodejs.zip');
const nodejsFilemanagerZip = join(hostingerDir, 'diagramtec-nodejs-filemanager.zip');
const nodejsBackendZip = join(hostingerDir, 'diagramtec-nodejs-backend.zip');

console.log('     diagramtec-nodejs-dentro-nodejs.zip...');
createZip(flatOut, nodejsDentroZip, { flat: true });
console.log('     diagramtec-nodejs-filemanager.zip...');
createZip(nodejsWrapped, nodejsFilemanagerZip);
console.log('     diagramtec-nodejs-backend.zip...');
createZip(backendOut, nodejsBackendZip, { flat: true });

writeFileSync(
  join(outDir, 'LEEME.txt'),
  [
    'DESPLIEGUE HOSTINGER — diagramtec.com',
    '====================================',
    '',
    `Sitio:  https://${domain}`,
    `API:    ${apiUrl}`,
    '',
    'PASO 1 — SITIO PRINCIPAL',
    `  Sube el contenido de public_html/ al public_html de ${domain} en hPanel.`,
    '  Borrá la carpeta public_html/php vieja del servidor si existe (ya no se usa).',
    '',
    'PASO 2 — CLOUDFLARE (recomendado)',
    '  DNS de diagramtec.com y api.diagramtec.com con proxy naranja, SSL "Full (strict)".',
    '  Turnstile: crear widget → VITE_TURNSTILE_SITE_KEY (site.env) y TURNSTILE_SECRET (Node).',
    '  Con proxy naranja poné TRUST_PROXY=2 en las variables de Node.',
    '',
    'PASO 3 — SUBDOMINIO api',
    `  hPanel → Dominios → Subdominios → crear "api" → ${domain}`,
    '',
    'PASO 4 — NODE.JS WEB APP',
    '  hPanel → Websites → Add Website → Node.js Web App',
    '  Sube nodejs-backend/ (o GitHub, rootDir: backend)',
    '  Entry: server.js | Start: npm start',
    '  Variables: ver nodejs-backend/.env.example',
    '  Asignar el subdominio api.diagramtec.com a esta app',
    '',
    'PASO 5 — SUPABASE',
    '  Ejecutar documents/db/supabase.sql en SQL Editor (Node también lo aplica al arrancar)',
    '',
    'PASO 6 — GOOGLE OAUTH',
    `  Redirect URI: ${apiUrl}/auth/google/callback`,
    '',
    'PASO 7 — PROBAR',
    `  ${apiUrl}/health  → {"status":"ok"}`,
    `  https://${domain} → home`,
    '',
  ].join('\n'),
  'utf8',
);

console.log(`\nListo: ${outDir}`);
console.log('  public_html/                        → sitio principal');
console.log('  nodejs-backend/                     → Node.js redeploy panel');
console.log('  nodejs/                             → carpeta para ZIP file manager');
console.log('  nodejs-flat/                        → archivos sueltos para dentro de nodejs/');
console.log('  LEEME.txt                           → instrucciones');
console.log('\nZIPs en hostinger/:');
console.log('  diagramtec-frontend-solo.zip          → extraer en public_html/ de diagramtec.com');
console.log('  diagramtec-nodejs-filemanager.zip   → extraer en domains/api.diagramtec.com/');
console.log('  diagramtec-nodejs-dentro-nodejs.zip → extraer DENTRO de nodejs/');
console.log('  diagramtec-nodejs-backend.zip       → panel Redeploy (si lo encontrás)');
