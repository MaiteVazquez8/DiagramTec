-- DiagramTec — esquema MySQL
-- Base de datos: tecdiagram (ver backend/.env.example)
--
-- Importar en Laragon / MySQL:
--   mysql -u root -p < documents/db/tecdiagram.sql
-- O desde HeidiSQL / phpMyAdmin: ejecutar este archivo completo.

CREATE DATABASE IF NOT EXISTS tecdiagram
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tecdiagram;

-- ---------------------------------------------------------------------------
-- Usuarios (roles: student, teacher, admin, superadmin)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'student',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Clases creadas por docentes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(255) NOT NULL UNIQUE,
  ownerId INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_code (code),
  INDEX idx_ownerId (ownerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Miembros de cada clase (estudiantes unidos por código)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS class_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classId INT NOT NULL,
  userId INT NOT NULL,
  joinedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_membership (classId, userId),
  FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_classId (classId),
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Diseños / diagramas (personales o compartidos en clase)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS designs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  ownerId INT NOT NULL,
  classId INT,
  content LONGTEXT NOT NULL,
  image LONGTEXT,
  pdf_data LONGTEXT,
  description TEXT,
  isCopy BOOLEAN DEFAULT FALSE,
  originalId INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (originalId) REFERENCES designs(id) ON DELETE SET NULL,
  INDEX idx_ownerId (ownerId),
  INDEX idx_classId (classId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Comentarios en el muro de una clase
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classId INT NOT NULL,
  userId INT NOT NULL,
  content TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_classId (classId),
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuario superadmin de desarrollo (opcional):
--   cd backend && node seed_admin.js
-- Credenciales por defecto del seed: admin@diagramtec.com / admin123
