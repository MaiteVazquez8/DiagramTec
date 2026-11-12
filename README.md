# DiagramTec

## Descripción

DiagramTec es una plataforma educativa colaborativa que permite a estudiantes y docentes crear, editar y gestionar diagramas de flujo de datos de manera intuitiva. Con un editor visual, sistema de autenticación y capacidades de exportación, DiagramTec facilita el aprendizaje del modelado de datos.

## Para iniciar

### Requisitos Previos

- Node.js 18+ ([descargar](https://nodejs.org/))
- npm 8+
- MySQL 5.7+ ([descargar](https://www.mysql.com/downloads/))

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/MaiteVazquez8/DiagramTec.git
   cd DiagramTec
   ```

2. **Configurar Backend**
   ```bash
   cd backend
   cp .env.example .env # Editar .env con tus credenciales de MySQL
   npm install
   ```

3. **Configurar Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Ejecución

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend disponible en http://localhost:4002
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend disponible en http://localhost:5173
```

Luego abre http://localhost:5173 en tu navegador.

## Crear usuarios con rol (superadmin, admin, teacher)

El registro público solo permite `student` / `teacher` (el de profesor exige código de invitación de un superadmin). Las cuentas `admin` y `superadmin` se crean aparte, por cualquiera de estos dos caminos.

**Opción A — seed desde el backend (recomendada)**

```bash
cd backend
ADMIN_EMAIL=vos@dominio.com ADMIN_PASSWORD='Clave-Fuerte-123!' node seed_admin.js
```

Crea el superadmin, o si el email ya existe, lo asciende a `superadmin` sin tocar su contraseña. La clave debe ser fuerte: 8+ caracteres con mayúscula, minúscula, número y símbolo.

**Opción B — SQL directo en Supabase (SQL Editor)**

```sql
-- Requiere la extensión pgcrypto (el esquema ya la crea).
INSERT INTO users ("firstName", "lastName", email, "passwordHash", role, email_verified_at)
VALUES
  ('Profe', 'Ejemplo', 'profe@diagramtec.com',    crypt('Cambiar-123!', gen_salt('bf', 10)), 'teacher',    now()),
  ('Admin', 'Ejemplo', 'admin@diagramtec.com',    crypt('Cambiar-123!', gen_salt('bf', 10)), 'admin',      now()),
  ('Super', 'Admin',   'superadmin@diagramtec.com', crypt('Cambiar-123!', gen_salt('bf', 10)), 'superadmin', now())
ON CONFLICT (email) DO UPDATE
  SET role = EXCLUDED.role,
      "passwordHash" = EXCLUDED."passwordHash",
      email_verified_at = COALESCE(users.email_verified_at, now());
```

Notas:

- `crypt(..., gen_salt('bf', 10))` genera un hash bcrypt compatible con el `bcrypt.compare` del backend; **nunca** guardes la contraseña en texto plano.
- `ON CONFLICT (email) DO UPDATE` hace la consulta idempotente: si el email ya existe, actualiza rol y contraseña.
- `email_verified_at = now()` deja la cuenta verificada (necesario para publicar en clases, comentar, etc.; el login en sí no lo exige).
- La fortaleza de la clave no se valida en este camino (eso lo hacen el registro y `seed_admin.js`), así que elegí una clave fuerte igual.
- Roles válidos (constraint `CHECK`): `student | teacher | admin | superadmin`.
- Ejecutá el SQL con un rol con privilegios (p. ej. `postgres` en el SQL Editor de Supabase): con `anon`/`authenticated` las tablas tienen RLS activado sin políticas y no hay permisos.
- No subas al repo ningún script con contraseñas reales.

## Estructura del Proyecto

```
diagramtec/
├── frontend/                    # Aplicación React
│   ├── src/
│   │   ├── api.js              # Cliente HTTP con Axios
│   │   ├── App.jsx             # Componente raíz
│   │   ├── AuthContext.jsx     # Contexto de autenticación
│   │   ├── components/         # Componentes reutilizables
│   │   │   ├── EditorUI.jsx
│   │   │   ├── EditorToolbar.jsx
│   │   │   ├── EditorSidebar.jsx
│   │   │   └── ...
│   │   ├── design/             # Lógica del editor
│   │   │   ├── models/         # Clases de datos
│   │   │   ├── math/           # Operaciones matemáticas
│   │   │   ├── operations/     # Manipulación de diagramas
│   │   │   ├── export/         # Exportación a PDF/imagen
│   │   │   └── constants/      # Configuración
│   │   ├── pages/              # Páginas de la aplicación
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── EditorPage.jsx
│   │   │   └── ...
│   │   └── styles.css          # Estilos globales
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                     # Servidor Express
│   ├── server.js               # Punto de entrada
│   ├── db.js                   # Conexión y esquema BD
│   ├── seed_admin.js           # Script de inicialización
│   ├── package.json
│   └── .env.example
└── documents/                   # Documentación (documents/db/supabase.sql = esquema)
```

## Stack Tecnológico

### Frontend
- **React** 18.3 - UI library
- **Vite** 5.4 - Build tool
- **React Router** 6.15 - Enrutamiento
- **Axios** 1.7 - Cliente HTTP
- **jsPDF** 4.2 - Generación de PDFs
- **html2canvas** 1.4 - Captura de canvas

### Backend
- **Express** 4.18 - Framework web
- **Node.js** 18+ - Runtime
- **PostgreSQL (Supabase)** - Base de datos
- **JWT** 9.0 - Autenticación
- **bcryptjs** 2.4 - Hash de contraseñas
- **CORS** 2.8 - Cross-origin requests

## API Endpoints Principales

### Autenticación
```
POST   /api/auth/register        # Crear cuenta (Turnstile)
POST   /api/auth/login           # Iniciar sesión (Turnstile + límite de intentos)
POST   /api/auth/recovery-code   # Pedir código por email (Turnstile)
POST   /api/auth/reset-password  # Cambiar contraseña con el código
GET    /api/auth/google          # Login con Google (OAuth)
GET    /api/auth/me              # Usuario actual
```

### Diagramas
```
GET    /api/designs            # Listar diseños del usuario
POST   /api/designs            # Crear nuevo diagrama
GET    /api/designs/:id        # Obtener diagrama
PUT    /api/designs/:id        # Actualizar diagrama
DELETE /api/designs/:id        # Eliminar diagrama
```

### Clases
```
GET    /api/classes            # Listar clases
POST   /api/classes            # Crear clase
PUT    /api/classes/:id        # Actualizar clase
GET    /api/classes/:id/students  # Estudiantes de la clase
```

## Seguridad

**En el código**
- Contraseñas con bcrypt (8+ caracteres con mayúscula, minúscula, número y símbolo).
- JWT HS256 de 24 h; en cada pedido se relee el usuario: borrar, degradar o cambiar la contraseña corta las sesiones al instante.
- La API no arranca en producción sin `JWT_SECRET` fuerte (32+ caracteres) ni `FRONTEND_URL`.
- Cloudflare Turnstile en registro, login y recuperación; límite de intentos por IP y por email.
- Código de recuperación criptográfico, guardado como HMAC, vence en 15 min, 5 intentos y un solo uso; la respuesta no revela si el correo existe.
- Google OAuth con `state` atado a una cookie HttpOnly (sin login CSRF), email verificado y token en el fragmento `#`.
- Permisos en el servidor: solo miembros ven una clase, su código y sus comentarios; copiar diseños exige acceso; solo un superadmin toca cuentas admin.
- Imágenes y PDF solo como `data:` (bloquea XSS con `javascript:`).
- CORS con lista blanca, cabeceras de seguridad en la API y CSP/HSTS en el sitio (`.htaccess`).
- Supabase: RLS activo **sin** políticas; la API REST pública (clave anon) no ve nada. El backend las cierra al arrancar.

**Infraestructura (VPS, ver [deploy/docker/README.md](deploy/docker/README.md))**
1. DNS en DigitalPlat: `diagramtec.qd.je`, `www` y `api` → `69.6.206.117`, más CAA solo para Let's Encrypt (sin Cloudflare: el plan Free no acepta `qd.je`).
2. Dos contenedores (sitio y API) detrás del Traefik del VPS, con HTTPS de Let's Encrypt y límites por IP; `TRUST_PROXY=1`.
3. Turnstile: widget **DiagramTec**; sitekey en `frontend/.env.production`, secret en el `api.env` del servidor. **Sin el secret el login en producción responde 500.**

Detalle completo (ataques que se previenen, pruebas y pendientes): [docs/SEGURIDAD.md](docs/SEGURIDAD.md). Pruebas: `cd backend && npm test`.

## Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` (copiá desde `backend/.env.example`; nunca lo subas al repo).

**Local:**

```env
DATABASE_URL=postgresql://...      # Supabase o un Postgres local
DB_SSL=true

PORT=4002
JWT_SECRET=                        # node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

FRONTEND_URL=http://localhost:5173
TURNSTILE_SECRET=1x0000000000000000000000000000000AA   # clave de prueba de Cloudflare

EMAIL_USER=diagramtec@gmail.com
EMAIL_PASS=                    # contraseña de aplicación Gmail (16 caracteres)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Producción (Supabase / Hostinger):** ver `hostinger/node.env.example`. Las credenciales de email van en hPanel → api.diagramtec.qd.je → Environment variables, no en el ZIP.

Generar contraseña de aplicación: https://myaccount.google.com/apppasswords

Probar SMTP local: `node backend/scripts/test-mail.js`
- [ ] Historial detallado de cambios
- [ ] Buscar y reemplazar en diagramas

---

**Si te gusta DiagramTec, por favor considera darle una estrella en GitHub!**
