const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

function openDb() {
  const file = path.join(__dirname, 'data', 'database.sqlite');
  const db = new Database(file);
  db.pragma('foreign_keys = ON');
  return db;
}

function generateClassCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function initDb(db) {
  // Drop tables if they exist to ensure schema is up to date
  db.exec(`
    DROP TABLE IF EXISTS designs;
    DROP TABLE IF EXISTS class_members;
    DROP TABLE IF EXISTS classes;
    DROP TABLE IF EXISTS users;
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      code TEXT NOT NULL UNIQUE,
      ownerId INTEGER NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS class_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      classId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      joinedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(classId, userId),
      FOREIGN KEY(classId) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS designs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      ownerId INTEGER NOT NULL,
      classId INTEGER,
      content TEXT NOT NULL,
      isCopy BOOLEAN DEFAULT FALSE,
      originalId INTEGER,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(classId) REFERENCES classes(id) ON DELETE SET NULL,
      FOREIGN KEY(originalId) REFERENCES designs(id) ON DELETE SET NULL
    );
  `);
}

module.exports = { openDb, initDb, generateClassCode };