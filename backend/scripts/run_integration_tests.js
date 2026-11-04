const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:4002';

async function run() {
  console.log('Running backend integration tests...');
  const client = axios.create({ baseURL: API_BASE, validateStatus: () => true });

  const checks = [
    {
      name: 'Health endpoint',
      fn: async () => client.get('/health'),
      success: (resp) => resp.status === 200,
    },
    {
      name: 'Unauthenticated auth/me returns 401',
      fn: async () => client.get('/auth/me'),
      success: (resp) => resp.status === 401,
    },
    {
      name: 'Unauthenticated classes list returns 401 or 403',
      fn: async () => client.get('/classes'),
      success: (resp) => [401, 403].includes(resp.status),
    },
    {
      name: 'Legacy /php routes fall through for unknown paths',
      fn: async () => client.get('/php/'),
      success: (resp) => resp.status >= 200 && resp.status < 500,
    },
    {
      name: 'Migrated login endpoint validates missing fields',
      fn: async () => client.post('/php/login.php', {}),
      success: (resp) => resp.status === 400 && resp.data?.error === 'Email y contraseña requeridos',
    },
    {
      name: 'Migrated token endpoint validates email',
      fn: async () => client.post('/php-auth/token.php', { email: 'no-es-un-correo' }),
      success: (resp) => resp.status === 400 && resp.data?.error === 'Ingresa un correo válido.',
    },
    {
      name: 'Migrated password reset endpoint validates missing fields',
      fn: async () => client.post('/php-auth/modificarClave.php', {}),
      success: (resp) => resp.status === 400 && resp.data?.error === 'Complete todos los campos',
    },
    {
      name: 'Migrated login form page renders HTML',
      fn: async () => client.get('/php-auth/login.php'),
      success: (resp) => resp.status === 200 && String(resp.data).includes('<form'),
    },
  ];

  let passed = 0;

  for (const check of checks) {
    process.stdout.write(`- ${check.name}... `);
    try {
      const resp = await check.fn();
      if (check.success(resp)) {
        console.log('OK');
        passed += 1;
      } else {
        console.log(`FAILED (status: ${resp.status})`);
      }
    } catch (error) {
      console.log('ERROR');
      console.error(error.message || error);
    }
  }

  console.log(`\n${passed} / ${checks.length} checks passed.`);
  process.exit(passed === checks.length ? 0 : 1);
}

run();