const mysql = require('mysql2/promise');
const crypto = require('crypto');

/**
 * Pool de conexiones MySQL.
 * Antes había una sola conexión compartida: todas las consultas de todos los
 * usuarios esperaban en fila. Con el pool se atienden varias a la vez.
 * Expone la misma API (execute, query, end), así que el resto del código no cambia.
 */
async function openDb() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tecdiagram',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
    enableKeepAlive: true,
  });
  // Falla al arrancar (como antes) si la base no está disponible.
  const conn = await pool.getConnection();
  conn.release();
  return pool;
}

function generateClassCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

module.exports = {
  openDb,
  generateClassCode,
};
