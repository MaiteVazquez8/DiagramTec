require('dotenv').config();
const { Pool } = require('pg');

const ref = 'tyoskyyaetsyqocjzxib';
const url = process.env.DATABASE_URL || '';
const passwordMatch = url.match(/postgres\.[^:]+:([^@]+)@/);
const password = passwordMatch ? decodeURIComponent(passwordMatch[1]) : process.env.DB_PASSWORD;

if (!password) {
  console.error('No se pudo leer la contraseña desde DATABASE_URL');
  process.exit(1);
}

const hosts = [
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-us-east-1.pooler.supabase.com',
  'aws-eu-west-1.pooler.supabase.com',
];

const ports = [5432, 6543];

(async () => {
  for (const host of hosts) {
    for (const port of ports) {
      const connectionString = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
      const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      try {
        await pool.query('SELECT 1');
        console.log('OK', { host, port });
        await pool.end();
        process.exit(0);
      } catch (error) {
        const msg = error.message || String(error);
        if (!msg.includes('ENOTFOUND') && !msg.includes('timeout')) {
          console.log('Cerca:', host, port, '→', msg.slice(0, 120));
        }
        await pool.end().catch(() => {});
      }
    }
  }
  console.error('Ninguna region funciono. Copia la URI exacta desde Supabase → Connect → Session pooler.');
  process.exit(1);
})();
