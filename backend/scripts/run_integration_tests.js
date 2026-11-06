// Pruebas de humo contra un backend corriendo: npm run test:integration
const jwt = require('jsonwebtoken');

const API_BASE = process.env.API_BASE || 'http://localhost:4002';
const get = (path, headers = {}) => fetch(`${API_BASE}${path}`, { headers });
const post = (path, body) => fetch(`${API_BASE}${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Token firmado con el secreto viejo que estaba publicado en el repo.
const forged = jwt.sign({ id: 1, role: 'superadmin' }, 'nuevaContraseña_superSegura_diagramtec');

const checks = [
  ['Health responde 200', () => get('/health'), (r) => r.status === 200],
  ['Cabeceras de seguridad', () => get('/health'), (r) => r.headers.get('x-content-type-options') === 'nosniff'
    && r.headers.get('x-frame-options') === 'DENY' && !r.headers.get('x-powered-by')],
  ['CORS no refleja orígenes ajenos', () => get('/health', { Origin: 'https://evil.example' }),
    (r) => r.headers.get('access-control-allow-origin') !== 'https://evil.example'],
  ['/auth/me sin token → 401', () => get('/auth/me'), (r) => r.status === 401],
  ['/classes sin token → 401', () => get('/classes'), (r) => r.status === 401],
  ['Token falsificado con el secreto viejo → 401', () => get('/admin/users', { Authorization: `Bearer ${forged}` }),
    (r) => r.status === 401],
  ['Ya no existe el proxy PHP', () => get('/php/login.php'), (r) => r.status === 404],
  ['Recuperación no revela si el correo existe', () => post('/auth/recovery-code', { email: 'nadie-1234@example.com' }),
    (r) => r.status === 200 || r.status === 403],
];

async function run() {
  console.log(`Running backend integration tests against ${API_BASE}...`);
  let passed = 0;
  for (const [name, request, ok] of checks) {
    process.stdout.write(`- ${name}... `);
    try {
      const resp = await request();
      if (ok(resp)) {
        console.log('OK');
        passed += 1;
      } else {
        console.log(`FAILED (status: ${resp.status})`);
      }
    } catch (error) {
      console.log('ERROR', error.message);
    }
  }
  console.log(`\n${passed} / ${checks.length} checks passed.`);
  process.exit(passed === checks.length ? 0 : 1);
}

run();
