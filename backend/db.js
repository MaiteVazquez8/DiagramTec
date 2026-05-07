const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tecdriagram',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function generateClassCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function initDb() {
  // First, create a connection without specifying the database to ensure it exists
  const connectionNoDb = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    await connectionNoDb.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'tecdriagram'}\``);
  } finally {
    await connectionNoDb.end();
  }

  const connection = await pool.getConnection();
  try {
    await connection.query(`USE \`${process.env.DB_NAME || 'tecdriagram'}\``);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        passwordHash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        code VARCHAR(50) NOT NULL UNIQUE,
        ownerId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX(ownerId),
        FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS class_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classId INT NOT NULL,
        userId INT NOT NULL,
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(classId, userId),
        INDEX(classId),
        INDEX(userId),
        FOREIGN KEY(classId) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS designs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        ownerId INT NOT NULL,
        classId INT,
        content LONGTEXT NOT NULL,
        image LONGTEXT,
        pdf_data LONGTEXT,
        isCopy BOOLEAN DEFAULT FALSE,
        originalId INT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX(ownerId),
        INDEX(classId),
        FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(classId) REFERENCES classes(id) ON DELETE SET NULL,
        FOREIGN KEY(originalId) REFERENCES designs(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classId INT NOT NULL,
        userId INT NOT NULL,
        content TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX(classId),
        INDEX(userId),
        FOREIGN KEY(classId) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    connection.release();
  }
}

module.exports = { pool, initDb, generateClassCode };
