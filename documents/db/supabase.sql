-- DiagramTec — esquema PostgreSQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
--
-- Compatible con el backend Node actual (mismos nombres de tabla/columna en camelCase).
-- El backend debe conectarse con la connection string de Supabase (pooler recomendado).

-- ---------------------------------------------------------------------------
-- Extensiones (uuid por si luego integras Supabase Auth)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Usuarios
-- Roles: student | teacher | admin | superadmin
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "firstName"   TEXT NOT NULL,
  "lastName"    TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT,
  "googleId"    TEXT UNIQUE,
  -- Recuperación de contraseña: solo el HMAC del código, con vencimiento e intentos.
  reset_code_hash     TEXT,
  reset_code_expires  TIMESTAMPTZ,
  reset_attempts      INT NOT NULL DEFAULT 0,
  -- Los JWT emitidos antes de esta fecha dejan de valer.
  password_changed_at TIMESTAMPTZ,
  role         TEXT NOT NULL DEFAULT 'student'
                CHECK (role IN ('student', 'teacher', 'admin', 'superadmin')),
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_googleId ON users ("googleId");

-- ---------------------------------------------------------------------------
-- Clases (creadas por docentes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  code          TEXT NOT NULL UNIQUE,
  "ownerId"     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classes_code    ON classes (code);
CREATE INDEX IF NOT EXISTS idx_classes_ownerId ON classes ("ownerId");

-- ---------------------------------------------------------------------------
-- Miembros de cada clase
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS class_members (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "classId"     BIGINT NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  "userId"      BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  "joinedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("classId", "userId")
);

CREATE INDEX IF NOT EXISTS idx_class_members_classId ON class_members ("classId");
CREATE INDEX IF NOT EXISTS idx_class_members_userId  ON class_members ("userId");

-- ---------------------------------------------------------------------------
-- Diseños / diagramas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS designs (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  "ownerId"     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  "classId"     BIGINT REFERENCES classes (id) ON DELETE SET NULL,
  content       TEXT NOT NULL,
  image         TEXT,
  pdf_data      TEXT,
  description   TEXT,
  "isCopy"      BOOLEAN NOT NULL DEFAULT FALSE,
  "originalId"  BIGINT REFERENCES designs (id) ON DELETE SET NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_designs_ownerId   ON designs ("ownerId");
CREATE INDEX IF NOT EXISTS idx_designs_classId   ON designs ("classId");
CREATE INDEX IF NOT EXISTS idx_designs_createdAt ON designs ("createdAt");

-- ---------------------------------------------------------------------------
-- Comentarios en el muro de una clase
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "classId"     BIGINT NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  "userId"      BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_classId   ON comments ("classId");
CREATE INDEX IF NOT EXISTS idx_comments_userId    ON comments ("userId");
CREATE INDEX IF NOT EXISTS idx_comments_createdAt ON comments ("createdAt");

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Todo pasa por la API Node, que se conecta como "postgres" y no depende de RLS.
-- RLS activado SIN políticas = la API REST pública de Supabase (clave anon) no
-- puede leer ni escribir nada. NUNCA crear políticas "USING (true)": exponen
-- emails y hashes de contraseña a cualquiera.
-- ---------------------------------------------------------------------------
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments      ENABLE ROW LEVEL SECURITY;

-- Defensa en profundidad: aunque alguien agregue una política por error, los roles
-- públicos de Supabase no tienen permisos sobre las tablas.
REVOKE ALL ON users, classes, class_members, designs, comments FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Si una base vieja tiene las políticas abiertas de desarrollo, se borran:
DROP POLICY IF EXISTS "dev_all_users"         ON users;
DROP POLICY IF EXISTS "dev_all_classes"       ON classes;
DROP POLICY IF EXISTS "dev_all_class_members" ON class_members;
DROP POLICY IF EXISTS "dev_all_designs"       ON designs;
DROP POLICY IF EXISTS "dev_all_comments"      ON comments;

-- Usuario propio de la API (recomendado en lugar de "postgres"). Generá el hash SCRAM de
-- una contraseña aleatoria en tu PC y pegá solo el hash; la contraseña va en DATABASE_URL
-- como diagramtec_api.<project_ref> en el Session pooler.
--   CREATE ROLE diagramtec_api LOGIN BYPASSRLS NOINHERIT PASSWORD 'SCRAM-SHA-256$4096:...';
--   GRANT USAGE ON SCHEMA public TO diagramtec_api;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON users, classes, class_members, designs, comments TO diagramtec_api;
--   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO diagramtec_api;
--   ALTER ROLE diagramtec_api SET statement_timeout = '15s';

-- Superadmin: desde backend/, con variables de entorno (sin contraseñas fijas):
--   ADMIN_EMAIL=vos@dominio.com ADMIN_PASSWORD='Clave-Fuerte-123' node seed_admin.js
