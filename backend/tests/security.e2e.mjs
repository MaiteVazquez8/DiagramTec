// Pruebas de seguridad de punta a punta: npm run test:security
// Levanta un PostgreSQL real y efímero (embedded-postgres), aplica documents/db/supabase.sql,
// simula una base vieja con las políticas RLS abiertas y arranca el backend contra ella.
// Turnstile usa las claves de prueba oficiales de Cloudflare (requiere internet).
import EmbeddedPostgres from 'embedded-postgres';
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { readFileSync, rmSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const BACKEND = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA = join(BACKEND, '..', 'documents', 'db', 'supabase.sql');
const require = createRequire(join(BACKEND, 'package.json'));
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const JWT_SECRET = crypto.randomBytes(48).toString('base64');
const DB_PORT = 54329;
const DATABASE_URL = `postgresql://postgres:test@127.0.0.1:${DB_PORT}/diagramtec`;
const PASS_TS = '1x0000000000000000000000000000000AA'; // clave de prueba: siempre pasa
const FAIL_TS = '2x0000000000000000000000000000000AA'; // clave de prueba: siempre falla
const TS = { 'cf-turnstile-response': 'XXXX.DUMMY.TOKEN.XXXX' };
const PASS = 'Clave-Segura-123';

const dataDir = mkdtempSync(join(tmpdir(), 'diagramtec-pg-'));
const pg = new EmbeddedPostgres({
  databaseDir: dataDir, user: 'postgres', password: 'test', port: DB_PORT, persistent: false,
  initdbFlags: ['--encoding=UTF8', '--locale=C'], onLog: () => {},
});

const results = [];
const check = (area, name, ok, extra = '') => results.push({ area, name, ok: Boolean(ok), extra });

function startServer(port, env) {
  const proc = spawn(process.execPath, ['server.js'], {
    cwd: BACKEND,
    env: {
      ...process.env, NODE_ENV: 'development', PORT: String(port), DATABASE_URL, DB_SSL: 'false', JWT_SECRET,
      FRONTEND_URL: 'http://localhost:5173', TURNSTILE_SECRET: PASS_TS, EMAIL_USER: '', EMAIL_PASS: '',
      GOOGLE_CLIENT_ID: 'test-client', GOOGLE_CLIENT_SECRET: 'test-secret',
      GOOGLE_CALLBACK_URL: 'http://localhost:5173/api/auth/google/callback', ...env,
    },
  });
  let logs = '';
  proc.stdout.on('data', (d) => { logs += d; });
  proc.stderr.on('data', (d) => { logs += d; });
  const exited = new Promise((resolve) => proc.on('exit', (code) => resolve(code)));
  return { proc, exited, logs: () => logs, api: `http://127.0.0.1:${port}` };
}

async function waitReady(api) {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`${api}/health`);
      if ((await r.json()).db === 'connected') return;
    } catch { /* todavía arrancando */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`El backend en ${api} no conectó a la base`);
}

// La sesión viaja en la cookie HttpOnly "dt_session"; `token` la envía como lo haría el navegador
// (con el Origin del frontend, que el chequeo CSRF exige en pedidos que modifican datos).
function client(api) {
  return async (method, path, { body, token, headers = {}, raw } = {}) => {
    const r = await fetch(`${api}${path}`, {
      method, redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Cookie: `dt_session=${token}`, Origin: 'http://localhost:5173' } : {}),
        ...headers,
      },
      body: raw ?? (body ? JSON.stringify(body) : undefined),
    });
    let data = null;
    try { data = await r.clone().json(); } catch { /* sin JSON */ }
    const setCookie = r.headers.get('set-cookie') || '';
    const session = /dt_session=([^;]+)/.exec(setCookie)?.[1] || null;
    return { status: r.status, data, headers: r.headers, setCookie, session };
  };
}

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

const servers = [];
let sql;
try {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('diagramtec');
  sql = new Client({ connectionString: DATABASE_URL });
  await sql.connect();
  // Roles públicos que Supabase expone por su API REST.
  await sql.query('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;');
  await sql.query(readFileSync(SCHEMA, 'utf8'));
  // Base "vieja": columna token, políticas abiertas y los permisos por defecto de Supabase.
  await sql.query('ALTER TABLE users ADD COLUMN token VARCHAR(6)');
  for (const t of ['users', 'classes', 'class_members', 'designs', 'comments']) {
    await sql.query(`CREATE POLICY "dev_all_${t}" ON ${t} FOR ALL USING (true) WITH CHECK (true)`);
    await sql.query(`GRANT ALL ON ${t} TO anon, authenticated`);
  }

  const dev = startServer(4010, {});
  servers.push(dev);
  await waitReady(dev.api);
  const call = client(dev.api);

  // ---------- Base de datos / Supabase
  const cols = (await sql.query("select column_name from information_schema.columns where table_name='users'")).rows.map((r) => r.column_name);
  const policies = (await sql.query("select count(*)::int n from pg_policies where policyname like 'dev_all_%'")).rows[0].n;
  const rls = (await sql.query("select count(*)::int n from pg_tables where schemaname='public' and rowsecurity")).rows[0].n;
  check('Supabase', 'Migración al arrancar agrega las columnas de recuperación', ['reset_code_hash', 'reset_code_expires', 'reset_attempts', 'password_changed_at'].every((c) => cols.includes(c)));
  check('Supabase', 'Borra las políticas RLS abiertas "dev_all_*"', policies === 0, `quedan ${policies}`);
  check('Supabase', 'RLS activo en las 6 tablas (incluida teacher_invites)', rls === 6, `${rls}/6`);
  const anonPriv = (await sql.query(`select count(*)::int n from (values ('users'),('classes'),('class_members'),('designs'),('comments'),('teacher_invites')) t(n)
    where has_table_privilege('anon', 'public.'||n, 'SELECT') or has_table_privilege('authenticated', 'public.'||n, 'INSERT')`)).rows[0].n;
  check('Supabase', 'Los roles públicos (anon/authenticated) pierden todo permiso sobre las tablas', anonPriv === 0, `${anonPriv} tablas con permiso`);

  // ---------- Registro, Turnstile y contraseñas
  check('Bots', 'Registro sin token de Turnstile → 403', (await call('POST', '/auth/register', { body: { firstName: 'A', lastName: 'B', email: 'x@test.com', password: PASS } })).status === 403);
  check('Contraseñas', 'Contraseña débil (6 caracteres) → 400', (await call('POST', '/auth/register', { body: { firstName: 'A', lastName: 'B', email: 'x@test.com', password: 'Ab1!xy', ...TS } })).status === 400);
  check('Validación', 'Email inválido → 400', (await call('POST', '/auth/register', { body: { firstName: 'A', lastName: 'B', email: 'no-es-email', password: PASS, ...TS } })).status === 400);
  // Invitaciones de profesor: se carga un código conocido (solo su hash, como hace la API).
  const INVITE = 'A1B2C3D4E5F6';
  await sql.query("insert into teacher_invites (code_hash, expires_at) values ($1, now() + interval '7 days')", [sha256(INVITE)]);
  const teacherBody = (extra) => ({ firstName: 'Tea', lastName: 'Cher', email: 'teacher@test.com', password: PASS, role: 'teacher', ...TS, ...extra });
  check('Escalada de privilegios', 'Registrarse como profesor sin código de invitación → 400', (await call('POST', '/auth/register', { body: teacherBody({}) })).status === 400);
  check('Escalada de privilegios', 'Registrarse como profesor con un código inventado → 400', (await call('POST', '/auth/register', { body: teacherBody({ inviteCode: 'FFFFFFFFFFFF' }) })).status === 400);
  const regT = await call('POST', '/auth/register', { body: teacherBody({ inviteCode: INVITE }) });
  check('Invitaciones', 'Con un código válido la cuenta se crea como profesor', regT.status === 200 && regT.data?.user?.role === 'teacher');
  check('Invitaciones', 'El código es de un solo uso', (await call('POST', '/auth/register', { body: { ...teacherBody({ inviteCode: INVITE }), email: 'teacher2@test.com' } })).status === 400);
  const regS = await call('POST', '/auth/register', { body: { firstName: 'Stu', lastName: 'Dent', email: 'student@test.com', password: PASS, role: 'student', ...TS } });
  const regO = await call('POST', '/auth/register', { body: { firstName: 'Otro', lastName: 'Alumno', email: 'otro@test.com', password: PASS, role: 'superadmin', ...TS } });
  check('Registro', 'Registro válido abre sesión', regT.status === 200 && regS.status === 200 && regT.session, `${regT.status}/${regS.status}`);
  check('Sesión en cookie', 'La sesión va en una cookie HttpOnly y SameSite=Lax', /HttpOnly/i.test(regT.setCookie) && /SameSite=Lax/i.test(regT.setCookie));
  check('Sesión en cookie', 'El token no aparece en el cuerpo de la respuesta (JavaScript no lo ve)', !JSON.stringify(regT.data).includes(regT.session));
  check('Verificación de email', 'La cuenta nueva queda sin verificar', regT.data?.user?.emailVerified === false);
  check('Escalada de privilegios', 'No se puede registrar como superadmin', regO.data?.user?.role === 'student');
  check('Contraseñas', 'Se guarda con bcrypt', /^\$2[aby]\$10\$/.test((await sql.query("select \"passwordHash\" h from users where email='teacher@test.com'")).rows[0].h));
  const tT = regT.session; const tS = regS.session; const tO = regO.session;

  // ---------- Login y fuerza bruta
  check('Login', 'Login correcto', (await call('POST', '/auth/login', { body: { email: 'teacher@test.com', password: PASS, ...TS } })).status === 200);
  await sql.query(`insert into users ("firstName","lastName",email,"googleId",role) values ('G','U','google@test.com','g-1','student')`);
  check('Login', 'Cuenta solo-Google con contraseña → 401 (antes 500)', (await call('POST', '/auth/login', { body: { email: 'google@test.com', password: PASS, ...TS } })).status === 401);
  let last;
  for (let i = 0; i < 9; i++) last = await call('POST', '/auth/login', { body: { email: 'student@test.com', password: 'Mala-123!x', ...TS } });
  check('Fuerza bruta', '9 intentos fallidos sobre la misma cuenta → 429', last.status === 429 && last.headers.get('retry-after'), String(last.status));

  // ---------- Recuperación de contraseña
  const recUnknown = await call('POST', '/auth/recovery-code', { body: { email: 'noexiste@test.com', ...TS } });
  const recKnown = await call('POST', '/auth/recovery-code', { body: { email: 'teacher@test.com', ...TS } });
  check('Enumeración de usuarios', 'Misma respuesta exista o no el correo', recUnknown.status === 200 && recKnown.status === 200 && recUnknown.data.message === recKnown.data.message);
  const tid = regT.data.user.id;
  const hmac = (code) => crypto.createHmac('sha256', JWT_SECRET).update(`${tid}:${code}`).digest('hex');
  check('Recuperación', 'El código se guarda como HMAC, no en texto plano', /^[0-9a-f]{64}$/.test((await sql.query('select reset_code_hash h from users where id=$1', [tid])).rows[0].h));
  const setCode = (code, expires = "now()+interval '15 minutes'") => sql.query(`update users set reset_code_hash=$1, reset_code_expires=${expires}, reset_attempts=0 where id=$2`, [hmac(code), tid]);
  const resetBody = (code, pw = 'Nueva-Clave-456') => ({ email: 'teacher@test.com', token: code, password: pw, password2: pw });
  await setCode('123456');
  for (let i = 0; i < 5; i++) await call('POST', '/auth/reset-password', { body: resetBody('000000') });
  check('Fuerza bruta', 'Tras 5 códigos erróneos, ni el correcto sirve', (await call('POST', '/auth/reset-password', { body: resetBody('123456') })).status === 400);
  await setCode('222222', "now()-interval '1 minute'");
  check('Recuperación', 'Código vencido → 400', (await call('POST', '/auth/reset-password', { body: resetBody('222222') })).status === 400);
  await new Promise((r) => setTimeout(r, 1100));
  await setCode('333333');
  check('Recuperación', 'Código válido cambia la contraseña', (await call('POST', '/auth/reset-password', { body: resetBody('333333') })).status === 200);
  check('Recuperación', 'El código es de un solo uso', (await call('POST', '/auth/reset-password', { body: resetBody('333333', 'Otra-Clave-789') })).status === 400);
  check('Sesiones', 'Cambiar la contraseña revoca los tokens anteriores', (await call('GET', '/auth/me', { token: tT })).status === 401);
  const tT2 = (await call('POST', '/auth/login', { body: { email: 'teacher@test.com', password: 'Nueva-Clave-456', ...TS } })).session;
  check('Recuperación', 'Login con la contraseña nueva', !!tT2);

  // ---------- Tokens
  const forgedOld = require('jsonwebtoken').sign({ id: 1, role: 'superadmin' }, 'nuevaContraseña_superSegura_diagramtec');
  check('Falsificación de tokens', 'Token firmado con el secreto viejo publicado → 401', (await call('GET', '/admin/users', { token: forgedOld })).status === 401);
  const [, payload] = tS.split('.');
  const noneToken = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${payload}.`;
  check('Falsificación de tokens', 'Token con alg "none" → 401', (await call('GET', '/auth/me', { token: noneToken })).status === 401);

  // ---------- Verificación de email
  check('Verificación de email', 'Sin verificar no se pueden crear clases', (await call('POST', '/classes', { token: tT2, body: { title: 'x' } })).data?.code === 'EMAIL_NOT_VERIFIED');
  check('Verificación de email', 'Sin verificar no se puede unir a clases', (await call('POST', '/classes/join', { token: tS, body: { code: 'ABCDEF12' } })).status === 403);
  const bad = await call('GET', `/auth/verify-email?token=${'0'.repeat(64)}`);
  check('Verificación de email', 'Un enlace inventado no verifica nada', /verified=invalid/.test(bad.headers.get('location') || ''));
  const verify = async (email) => {
    const tok = crypto.randomBytes(32).toString('hex');
    await sql.query("update users set verify_token_hash=$1, verify_token_expires=now()+interval '24 hours' where email=$2", [sha256(tok), email]);
    return call('GET', `/auth/verify-email?token=${tok}`);
  };
  const okVerify = await verify('teacher@test.com');
  check('Verificación de email', 'El enlace válido verifica la cuenta', /verified=ok/.test(okVerify.headers.get('location') || '')
    && (await call('GET', '/auth/me', { token: tT2 })).data?.user?.emailVerified === true);
  check('Verificación de email', 'El enlace guarda solo el sha256 del token', /^[0-9a-f]{64}$/.test((await sql.query("select verify_token_hash h from users where email='teacher@test.com'")).rows[0].h));
  await verify('student@test.com');
  await verify('otro@test.com');

  // ---------- Clases (control de acceso)
  const cls = await call('POST', '/classes', { token: tT2, body: { title: 'Clase 1', description: 'd' } });
  const classId = cls.data.class.id; const code = cls.data.class.code;
  check('Escalada de privilegios', 'Un alumno no puede crear clases', (await call('POST', '/classes', { token: tS, body: { title: 'x' } })).status === 403);
  const avail = await call('GET', '/classes/available', { token: tS });
  check('IDOR / fuga de datos', '/classes/available no expone códigos de clase', avail.status === 200 && avail.data.classes.every((c) => !('code' in c)));
  check('IDOR / fuga de datos', 'Un no miembro no ve la clase ni su código', (await call('GET', `/classes/${classId}`, { token: tS })).status === 404);
  check('IDOR / fuga de datos', 'Un no miembro no puede comentar', (await call('POST', `/classes/${classId}/comments`, { token: tS, body: { content: 'hola' } })).status === 403);
  check('IDOR / fuga de datos', 'Un no miembro no ve los miembros', (await call('GET', `/classes/${classId}/members`, { token: tS })).status === 403);
  check('Clases', 'Unirse con el código', (await call('POST', '/classes/join', { token: tS, body: { code } })).status === 200);
  check('Clases', 'Un miembro ve la clase y comenta', (await call('GET', `/classes/${classId}`, { token: tS })).status === 200
    && (await call('POST', `/classes/${classId}/comments`, { token: tS, body: { content: 'hola' } })).status === 200);
  check('Validación', 'Comentario de más de 2000 caracteres → 400', (await call('POST', `/classes/${classId}/comments`, { token: tS, body: { content: 'a'.repeat(2001) } })).status === 400);
  let joinLast;
  for (let i = 0; i < 21; i++) joinLast = await call('POST', '/classes/join', { token: tO, body: { code: `ZZ${i}` } });
  check('Fuerza bruta', 'Probar códigos de clase en masa → 429', joinLast.status === 429, String(joinLast.status));

  // ---------- Diseños
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  const dT = await call('POST', '/designs', { token: tT2, body: { title: 'Privado', content: '{}', image: png } });
  check('Diseños', 'El profesor crea un diseño', dT.status === 200);
  check('IDOR / fuga de datos', 'Ver un diseño privado ajeno → 403', (await call('GET', `/designs/${dT.data.design.id}`, { token: tO })).status === 403);
  check('IDOR / fuga de datos', 'Copiar un diseño privado ajeno → 403', (await call('POST', `/designs/${dT.data.design.id}/copy`, { token: tO })).status === 403);
  check('IDOR / fuga de datos', 'Editar o borrar un diseño ajeno → 403', (await call('PUT', `/designs/${dT.data.design.id}`, { token: tO, body: { title: 'x' } })).status === 403
    && (await call('DELETE', `/designs/${dT.data.design.id}`, { token: tO })).status === 403);
  check('Escalada de privilegios', 'Un alumno no publica en una clase al crear', (await call('POST', '/designs', { token: tS, body: { title: 'x', content: '{}', classId } })).status === 403);
  check('XSS', 'pdf_data "javascript:" → 400', (await call('POST', '/designs', { token: tS, body: { title: 'x', content: '{}', pdf_data: 'javascript:alert(document.cookie)' } })).status === 400);
  check('XSS', 'image "data:text/html" → 400', (await call('POST', '/designs', { token: tS, body: { title: 'x', content: '{}', image: 'data:text/html;base64,PHNjcmlwdD4=' } })).status === 400);
  const pub = await call('POST', '/designs', { token: tT2, body: { title: 'Pub', content: '{}', classId, pdf_data: 'data:application/pdf;filename=generated.pdf;base64,JVBERi0=' } });
  check('Diseños', 'El profesor publica en su clase con un PDF válido', pub.status === 200);
  check('Diseños', 'Un miembro puede copiar el diseño de la clase', (await call('POST', `/designs/${pub.data.design.id}/copy`, { token: tS })).status === 200);
  const bigImage = `data:image/png;base64,${'A'.repeat(1_000_000)}`;
  check('DoS', 'Los diseños aceptan cuerpos grandes (1 MB)', (await call('POST', '/designs', { token: tT2, body: { title: 'Grande', content: '{}', image: bigImage } })).status === 200);
  check('Inyección SQL', 'Un id con SQL en la ruta → 400, sin llegar a la base', (await call('GET', `/designs/1%20OR%201=1`, { token: tO })).status === 400);
  const sqliLogin = await call('POST', '/auth/login', { body: { email: "' OR '1'='1' --", password: "' OR '1'='1", ...TS } });
  check('Inyección SQL', "Login con ' OR '1'='1 → 400/401 (consultas parametrizadas)", [400, 401].includes(sqliLogin.status), String(sqliLogin.status));
  await call('POST', `/classes/${classId}/comments`, { token: tS, body: { content: "x'); DROP TABLE users; --" } });
  check('Inyección SQL', 'Un comentario con DROP TABLE se guarda como texto y la tabla sigue', (await sql.query('select count(*)::int n from users')).rows[0].n > 0);

  // ---------- Administración
  const adminHash = await bcrypt.hash(PASS, 4);
  await sql.query(`insert into users ("firstName","lastName",email,"passwordHash",role) values ('Ad','Min','admin@test.com',$1,'admin'),('Su','Per','super@test.com',$1,'superadmin')`, [adminHash]);
  const tA = (await call('POST', '/auth/login', { body: { email: 'admin@test.com', password: PASS, ...TS } })).session;
  const tSu = (await call('POST', '/auth/login', { body: { email: 'super@test.com', password: PASS, ...TS } })).session;
  const superId = (await sql.query("select id from users where email='super@test.com'")).rows[0].id;
  const sid = regS.data.user.id;
  check('Escalada de privilegios', 'Un alumno no entra al panel admin', (await call('GET', '/admin/users', { token: tS })).status === 403);
  check('Escalada de privilegios', 'Un admin no puede ascender a superadmin', (await call('PUT', `/admin/users/${sid}`, { token: tA, body: { firstName: 'S', lastName: 'D', email: 'student@test.com', role: 'superadmin' } })).status === 403);
  check('Escalada de privilegios', 'Un admin no puede borrar a un superadmin', (await call('DELETE', `/admin/users/${superId}`, { token: tA })).status === 403);
  const keep = await call('PUT', `/admin/users/${sid}`, { token: tA, body: { firstName: 'S', lastName: 'D', email: 'student@test.com' } });
  check('Administración', 'Editar sin mandar rol no lo cambia', keep.status === 200 && keep.data.user.role === 'student');
  check('Administración', 'Un superadmin sí puede cambiar roles', (await call('PUT', `/admin/users/${sid}`, { token: tSu, body: { firstName: 'S', lastName: 'D', email: 'student@test.com', role: 'teacher' } })).status === 200);
  check('Sesiones', 'El rol nuevo se aplica sin volver a iniciar sesión', (await call('GET', '/auth/me', { token: tS })).data?.user?.role === 'teacher');
  await call('DELETE', `/admin/users/${regO.data.user.id}`, { token: tSu });
  check('Sesiones', 'El token de un usuario borrado deja de valer', (await call('GET', '/auth/me', { token: tO })).status === 401);
  const self = await call('POST', '/auth/register', { body: { firstName: 'Se', lastName: 'Va', email: 'baja@test.com', password: PASS, ...TS } });
  check('Acciones sensibles', 'Borrar la cuenta sin contraseña → 400', (await call('DELETE', '/auth/me', { token: self.session, body: {} })).status === 400);
  check('Acciones sensibles', 'Borrar la cuenta con contraseña incorrecta → 401', (await call('DELETE', '/auth/me', { token: self.session, body: { password: 'Mala-123!x' } })).status === 401);
  const bye = await call('DELETE', '/auth/me', { token: self.session, body: { password: PASS } });
  check('Acciones sensibles', 'Con la contraseña correcta se borra (204) y la sesión deja de valer', bye.status === 204
    && (await call('GET', '/auth/me', { token: self.session })).status === 401);

  // ---------- Invitaciones desde la API
  check('Invitaciones', 'Un admin común no genera códigos de invitación', (await call('POST', '/admin/invites', { token: tA })).status === 403);
  const inv = await call('POST', '/admin/invites', { token: tSu });
  check('Invitaciones', 'Un superadmin genera un código de 12 caracteres que vence', inv.status === 200 && /^[0-9A-F]{12}$/.test(inv.data?.code) && !!inv.data?.expiresAt);
  check('Invitaciones', 'En la base solo queda el hash del código', (await sql.query('select count(*)::int n from teacher_invites where code_hash=$1', [sha256(inv.data.code)])).rows[0].n === 1
    && (await sql.query('select count(*)::int n from teacher_invites where code_hash=$1', [inv.data.code])).rows[0].n === 0);
  check('Invitaciones', 'Ese código permite registrarse como profesor', (await call('POST', '/auth/register', { body: { ...teacherBody({ inviteCode: inv.data.code.toLowerCase() }), email: 'teacher3@test.com' } })).data?.user?.role === 'teacher');

  // ---------- CSRF y cierre de sesión
  check('CSRF', 'Un pedido con la cookie desde otro origen → 403', (await call('POST', '/classes', { token: tT2, body: { title: 'csrf' }, headers: { Origin: 'https://evil.example' } })).status === 403);
  check('CSRF', 'Un pedido con la cookie sin Origin → 403', (await call('POST', '/classes', { token: tT2, body: { title: 'csrf' }, headers: { Origin: '' } })).status === 403);
  const out = await call('POST', '/auth/logout', { token: tT2 });
  check('Sesión en cookie', 'Cerrar sesión borra la cookie', out.status === 204 && /dt_session=;/.test(out.setCookie) && /Expires=Thu, 01 Jan 1970/i.test(out.setCookie));

  // ---------- Perfil: email y contraseña exigen la contraseña actual
  const prof = await call('POST', '/auth/register', { body: { firstName: 'Pe', lastName: 'Rfil', email: 'perfil@test.com', password: PASS, ...TS } });
  const profBody = (extra) => ({ firstName: 'Pe', lastName: 'Rfil', email: 'perfil@test.com', ...extra });
  check('Acciones sensibles', 'Cambiar el email sin la contraseña actual → 400', (await call('PUT', '/auth/me', { token: prof.session, body: profBody({ email: 'nuevo@test.com' }) })).status === 400);
  check('Acciones sensibles', 'Cambiar el email con una contraseña incorrecta → 401', (await call('PUT', '/auth/me', { token: prof.session, body: profBody({ email: 'nuevo@test.com', currentPassword: 'Mala-123!x' }) })).status === 401);
  const chg = await call('PUT', '/auth/me', { token: prof.session, body: profBody({ email: 'nuevo@test.com', currentPassword: PASS }) });
  check('Acciones sensibles', 'El email nuevo queda pendiente hasta confirmarlo', chg.status === 200 && chg.data?.user?.email === 'perfil@test.com' && chg.data?.user?.pendingEmail === 'nuevo@test.com');
  const confirm = await verify('perfil@test.com');
  check('Acciones sensibles', 'Al confirmar desde el correo nuevo, el cambio se aplica', /verified=ok/.test(confirm.headers.get('location') || '')
    && (await call('GET', '/auth/me', { token: prof.session })).data?.user?.email === 'nuevo@test.com');
  await new Promise((r) => setTimeout(r, 1100));
  const pw = await call('PUT', '/auth/me', { token: prof.session, body: { firstName: 'Pe', lastName: 'Rfil', email: 'nuevo@test.com', currentPassword: PASS, newPassword: 'Otra-Clave-999' } });
  check('Acciones sensibles', 'Cambiar la contraseña desde el perfil funciona (antes se ignoraba)', pw.status === 200
    && (await call('POST', '/auth/login', { body: { email: 'nuevo@test.com', password: 'Otra-Clave-999', ...TS } })).status === 200);
  check('Sesiones', 'Tras cambiarla, la sesión vieja se corta y la del navegador se renueva', (await call('GET', '/auth/me', { token: prof.session })).status === 401
    && (await call('GET', '/auth/me', { token: pw.session })).status === 200);

  // ---------- Google OAuth
  const g = await call('GET', '/auth/google');
  const setCookie = g.headers.get('set-cookie') || '';
  check('Login CSRF', 'El inicio con Google pone una cookie de state HttpOnly, SameSite=Lax y Path=/', g.status === 302 && /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie) && /Path=\//.test(setCookie));
  const state = new URL(g.headers.get('location')).searchParams.get('state');
  const cb = await call('GET', `/auth/google/callback?code=abc&state=${encodeURIComponent(state)}`);
  check('Login CSRF', 'Callback con un state válido pero sin la cookie del navegador → rechazado', /error=oauth_state/.test(cb.headers.get('location') || ''));

  // Vinculación con Google (en proceso, sin llamar a Google).
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.DATABASE_URL = DATABASE_URL;
  process.env.DB_SSL = 'false';
  const { openDb } = require('./db');
  const authService = require('./services/authService');
  const db = await openDb();
  const attacker = await call('POST', '/auth/register', { body: { firstName: 'Mal', lastName: 'O', email: 'victima@test.com', password: PASS, ...TS } });
  await new Promise((r) => setTimeout(r, 1100));
  const linked = await authService.loginOrRegisterWithGoogle(db, { googleId: 'g-victima', email: 'victima@test.com', firstName: 'Vic', lastName: 'Tima' });
  check('Robo de cuenta previo', 'Al vincular Google, la contraseña puesta por un tercero deja de servir', linked && (await call('POST', '/auth/login', { body: { email: 'victima@test.com', password: PASS, ...TS } })).status === 401);
  check('Robo de cuenta previo', 'Y su sesión abierta se corta', (await call('GET', '/auth/me', { token: attacker.session })).status === 401);
  let mismatch = false;
  try { await authService.loginOrRegisterWithGoogle(db, { googleId: 'g-otro', email: 'victima@test.com', firstName: 'X', lastName: 'Y' }); } catch (e) { mismatch = e.message === 'GOOGLE_ACCOUNT_MISMATCH'; }
  check('Robo de cuenta previo', 'Otra identidad de Google con el mismo email → rechazada', mismatch);
  await db.end();

  // ---------- Red y cabeceras
  const evil = await call('GET', '/health', { headers: { Origin: 'https://evil.example' } });
  const good = await call('GET', '/health', { headers: { Origin: 'http://localhost:5173' } });
  check('CORS', 'Un origen ajeno no recibe permiso; el frontend sí', !evil.headers.get('access-control-allow-origin') && good.headers.get('access-control-allow-origin') === 'http://localhost:5173');
  check('Clickjacking / sniffing', 'Cabeceras X-Frame-Options, nosniff, CSP y sin X-Powered-By', evil.headers.get('x-frame-options') === 'DENY'
    && evil.headers.get('x-content-type-options') === 'nosniff' && evil.headers.get('content-security-policy')?.includes("default-src 'none'") && !evil.headers.get('x-powered-by'));
  check('DoS', 'Cuerpo de 200 KB en /auth/login → 413', (await call('POST', '/auth/login', { raw: JSON.stringify({ x: 'a'.repeat(200_000) }) })).status === 413);
  check('DoS', 'JSON malformado → 400 (sin traza interna)', (await call('POST', '/auth/login', { raw: '{"email":' })).status === 400);
  check('Superficie de ataque', 'El proxy PHP ya no existe', (await call('GET', '/php/login.php')).status === 404);

  // ---------- Turnstile real contra Cloudflare
  const failTs = startServer(4011, { TURNSTILE_SECRET: FAIL_TS });
  servers.push(failTs);
  await waitReady(failTs.api);
  check('Bots', 'Token rechazado por Cloudflare (siteverify) → 403', (await client(failTs.api)('POST', '/auth/login', { body: { email: 'teacher@test.com', password: 'Nueva-Clave-456', ...TS } })).status === 403);

  // ---------- Modo producción
  const prod = startServer(4012, { NODE_ENV: 'production' });
  servers.push(prod);
  await waitReady(prod.api);
  const prodCall = client(prod.api);
  check('Bots', 'En producción no se aceptan las claves de prueba de Turnstile', (await prodCall('POST', '/auth/login', { body: { email: 'teacher@test.com', password: 'Nueva-Clave-456', ...TS } })).status === 403);
  check('HTTPS', 'En producción la API envía HSTS', (await prodCall('GET', '/health')).headers.get('strict-transport-security')?.includes('max-age=31536000'));
  const weak = startServer(4013, { NODE_ENV: 'production', JWT_SECRET: 'nuevaContraseña_superSegura_diagramtec' });
  servers.push(weak);
  check('Falsificación de tokens', 'En producción no arranca con un JWT_SECRET débil', (await Promise.race([weak.exited, new Promise((r) => setTimeout(() => r('timeout'), 8000))])) === 1);
  const noCors = startServer(4014, { NODE_ENV: 'production', FRONTEND_URL: '' });
  servers.push(noCors);
  check('CORS', 'En producción no arranca sin FRONTEND_URL', (await Promise.race([noCors.exited, new Promise((r) => setTimeout(() => r('timeout'), 8000))])) === 1);
} catch (err) {
  check('Prueba', 'Excepción inesperada', false, err.stack);
} finally {
  for (const s of servers) s.proc.kill();
  if (sql) await sql.end().catch(() => {});
  await pg.stop().catch(() => {});
  rmSync(dataDir, { recursive: true, force: true });
}

let fails = 0;
for (const { area, name, ok, extra } of results) {
  if (!ok) fails += 1;
  console.log(`${ok ? 'OK  ' : 'FAIL'} [${area}] ${name}${!ok && extra ? `  → ${extra}` : ''}`);
}
console.log(`\n${results.length - fails}/${results.length} pruebas OK`);
if (fails) console.log(`\n--- logs del backend ---\n${servers[0]?.logs().slice(-3000) || ''}`);
process.exit(fails ? 1 : 0);
