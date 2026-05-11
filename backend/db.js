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

async function initDb(db) {
  // USERS (no se borra nunca)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      firstName VARCHAR(255) NOT NULL,
      lastName VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'student',
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  // CLASSES
  await db.execute(`
    CREATE TABLE IF NOT EXISTS classes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      code VARCHAR(255) NOT NULL UNIQUE,
      ownerId INT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // CLASS MEMBERS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS class_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      classId INT NOT NULL,
      userId INT NOT NULL,
      joinedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(classId, userId),
      FOREIGN KEY(classId) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  // DESIGNS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS designs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      ownerId INT NOT NULL,
      classId INT,
      content TEXT NOT NULL,
      image LONGTEXT,
      pdf_data LONGTEXT,
      description TEXT,
      isCopy BOOLEAN DEFAULT FALSE,
      originalId INT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(classId) REFERENCES classes(id) ON DELETE SET NULL,
      FOREIGN KEY(originalId) REFERENCES designs(id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);
  // COMMENTS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      classId INT NOT NULL,
      userId INT NOT NULL,
      content TEXT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(classId) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
}

module.exports = { openDb, initDb, generateClassCode };