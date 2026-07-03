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
  token         VARCHAR(6),
  role          TEXT NOT NULL DEFAULT 'student'
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
-- Row Level Security (opcional)
-- El backend Node con service_role ignora RLS.
-- Si el frontend habla directo con Supabase, activa políticas aquí.
-- ---------------------------------------------------------------------------
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments      ENABLE ROW LEVEL SECURITY;

-- Políticas abiertas solo para desarrollo (reemplazar en producción)
CREATE POLICY "dev_all_users"         ON users         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_classes"       ON classes       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_class_members" ON class_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_designs"       ON designs       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_comments"      ON comments      FOR ALL USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Superadmin de desarrollo (opcional)
-- Contraseña: admin123  →  genera el hash con: cd backend && node seed_admin.js
-- y pega el passwordHash resultante, o inserta desde el seed del backend.
-- ---------------------------------------------------------------------------
-- INSERT INTO users ("firstName", "lastName", email, "passwordHash", role)
-- VALUES (
--   'Super',
--   'Admin',
--   'admin@diagramtec.com',
--   '$2a$10$...',  -- bcrypt de admin123
--   'superadmin'
-- );
