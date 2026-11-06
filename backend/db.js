const { Pool } = require('pg');
const crypto = require('crypto');

const CAMEL_IDENTIFIERS = [
  'firstName',
  'lastName',
  'passwordHash',
  'googleId',
  'createdAt',
  'ownerId',
  'classId',
  'userId',
  'joinedAt',
  'isCopy',
  'originalId',
];

/** PostgreSQL lowercases unquoted aliases (AS ownerName → ownername). */
const LOWER_TO_CAMEL = {
  firstname: 'firstName',
  lastname: 'lastName',
  passwordhash: 'passwordHash',
  googleid: 'googleId',
  createdat: 'createdAt',
  ownerid: 'ownerId',
  classid: 'classId',
  userid: 'userId',
  joinedat: 'joinedAt',
  iscopy: 'isCopy',
  originalid: 'originalId',
  ownername: 'ownerName',
  ownerrole: 'ownerRole',
  fullname: 'fullName',
  authorname: 'authorName',
  authorid: 'authorId',
  authorrole: 'authorRole',
  studentcount: 'studentCount',
  totalusers: 'totalUsers',
  totalclasses: 'totalClasses',
  totaldesigns: 'totalDesigns',
};

function normalizeKey(key) {
  if (typeof key !== 'string') return key;
  return LOWER_TO_CAMEL[key.toLowerCase()] || key;
}

function toPostgresPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

function quoteCamelIdentifiers(sql) {
  let result = sql;
  for (const id of CAMEL_IDENTIFIERS) {
    const re = new RegExp(`(?<![\"a-zA-Z])${id}(?![\"a-zA-Z])`, 'g');
    result = result.replace(re, `"${id}"`);
  }
  return result;
}

function prepareSql(sql) {
  let pgSql = quoteCamelIdentifiers(toPostgresPlaceholders(sql));
  const isInsert = /^\s*INSERT\s+INTO\s+/i.test(sql.trim());
  if (isInsert && !/\bRETURNING\b/i.test(pgSql)) {
    pgSql = `${pgSql.replace(/;\s*$/, '')} RETURNING id`;
  }
  return pgSql;
}

function normalizeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    const outKey = normalizeKey(key);
    if (typeof value === 'string' && /^-?\d+$/.test(value) && outKey !== 'content' && outKey !== 'token') {
      const asNumber = Number(value);
      if (Number.isSafeInteger(asNumber)) {
        normalized[outKey] = asNumber;
        continue;
      }
    }
    normalized[outKey] = value;
  }
  return normalized;
}

class PgConnection {
  constructor(pool) {
    this.pool = pool;
  }

  async execute(sql, params = []) {
    const pgSql = prepareSql(sql);
    const result = await this.pool.query(pgSql, params);
    const isInsert = /^\s*INSERT\s+INTO\s+/i.test(sql.trim());

    const header = {
      affectedRows: result.rowCount ?? 0,
      insertId: null,
    };

    if (isInsert && result.rows[0]?.id != null) {
      header.insertId = Number(result.rows[0].id);
      return [header, undefined];
    }

    return [result.rows.map(normalizeRow), undefined];
  }

  async end() {
    await this.pool.end();
  }
}

function resolveSsl() {
  if (process.env.DB_SSL === 'false') return false;
  // Con el certificado de Supabase (Settings → Database → SSL) se verifica el servidor.
  if (process.env.DB_SSL_CA) {
    return { ca: require('fs').readFileSync(process.env.DB_SSL_CA, 'utf8'), rejectUnauthorized: true };
  }
  console.warn('DB_SSL_CA no configurado: la conexión va cifrada pero sin verificar el certificado.');
  return { rejectUnauthorized: false };
}

/**
 * Migración idempotente al arrancar:
 * - columnas para la recuperación de contraseña segura y la revocación de sesiones;
 * - quita las políticas RLS "dev_all_*" que dejaban toda la base abierta a la clave anon
 *   de Supabase (el backend usa el rol postgres, que no depende de RLS).
 */
async function ensureSchema(pool) {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_hash TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_attempts INT NOT NULL DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
  `);
  for (const table of ['users', 'classes', 'class_members', 'designs', 'comments']) {
    try {
      await pool.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      await pool.query(`DROP POLICY IF EXISTS "dev_all_${table}" ON ${table}`);
    } catch (err) {
      console.error(`No se pudo cerrar RLS en ${table} (correr documents/db/supabase.sql a mano):`, err.message);
    }
  }
}

function resolvePoolConfig() {
  const ssl = resolveSsl();
  const max = Number(process.env.DB_POOL_MAX || 10);

  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD) {
    const config = {
      host: process.env.PGHOST.trim(),
      user: process.env.PGUSER.trim(),
      password: process.env.PGPASSWORD,
      database: (process.env.PGDATABASE || 'postgres').trim(),
      port: Number(process.env.PGPORT || 5432),
      ssl,
      max,
    };
    console.log(`DB config: user=${config.user} host=${config.host}:${config.port} (PG* vars)`);
    return config;
  }

  const connectionString = (process.env.DATABASE_URL || '').trim();
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL o PGHOST/PGUSER/PGPASSWORD no están configurados.',
    );
  }

  try {
    const parsed = new URL(connectionString);
    console.log(`DB config: user=${decodeURIComponent(parsed.username)} host=${parsed.hostname}:${parsed.port || 5432} (DATABASE_URL)`);
  } catch {
    console.log('DB config: DATABASE_URL set (could not parse for log)');
  }

  return {
    connectionString,
    ssl,
    max,
  };
}

async function openDb() {
  const pool = new Pool(resolvePoolConfig());

  await pool.query('SELECT 1');
  await ensureSchema(pool);

  return new PgConnection(pool);
}

function generateClassCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

module.exports = {
  openDb,
  generateClassCode,
};
