const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function openDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tecdiagram',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });
  return connection;
}

function generateClassCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

module.exports = { 
  openDb, 
  generateClassCode 
};