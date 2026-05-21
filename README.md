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

## 📁 Estructura del Proyecto

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
├── php/                         # Scripts PHP auxiliares
│   ├── login.php
│   ├── registro.php
│   ├── jwt.php
│   └── mail.php
└── documents/                   # Documentación
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
- **MySQL** 5.7+ - Base de datos
- **JWT** 9.0 - Autenticación
- **bcryptjs** 2.4 - Hash de contraseñas
- **CORS** 2.8 - Cross-origin requests

## API Endpoints Principales

### Autenticación
```
POST   /api/auth/register      # Crear nueva cuenta
POST   /api/auth/login         # Iniciar sesión
POST   /api/auth/refresh       # Renovar token
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

- Contraseñas hasheadas con bcryptjs
- Autenticación basada en JWT
- Validación de permisos en servidor
- CORS configurado
- Validación de entrada en cliente y servidor
- Se recomienda HTTPS en producción

## Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/`:

```envDB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nombreDB
DB_PORT=3306

JWT_SECRET=nuevaContraseña_superSegura_diagramtec

EMAIL_USER=diagramtec@gmail.com
EMAIL_PASS=poxtavbmlepblanm #clave de aplicación para gmail
```
- [ ] Historial detallado de cambios
- [ ] Buscar y reemplazar en diagramas

---

**⭐ Si te gusta DiagramTec, por favor considera darle una estrella en GitHub!**
