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
    if (typeof value === 'string' && /^-?\d+$/.test(value) && key !== 'content' && key !== 'token') {
      const asNumber = Number(value);
      if (Number.isSafeInteger(asNumber)) {
        normalized[key] = asNumber;
        continue;
      }
    }
    normalized[key] = value;
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

async function openDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL no está configurada. Añádela en backend/.env (Supabase → Settings → Database).',
    );
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: Number(process.env.DB_POOL_MAX || 10),
  });

  await pool.query('SELECT 1');

  return new PgConnection(pool);
}

function generateClassCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

module.exports = {
  openDb,
  generateClassCode,
};
