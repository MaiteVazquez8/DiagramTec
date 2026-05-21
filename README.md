# DiagramTec

Proyecto de ejemplo con frontend en React y backend en Node.js para crear diagramas de flujo de datos (DFD).

## Estructura

- `frontend/`: aplicación React con Vite.
- `backend/`: servidor Express con base de datos SQLite.

## Requisitos

- Node.js 18+ recomendado.

## Instalación

1. Instalar dependencias del backend:

```bash
cd backend
npm install
```

2. Instalar dependencias del frontend:

```bash
cd ../frontend
npm install
```

## Ejecución

1. Iniciar el backend:

```bash
cd backend
npm run dev
```

2. Iniciar el frontend:

```bash
cd frontend
npm run dev
```

3. Abrir en el navegador:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Funcionalidades incluidas

- Registro y login con roles `student` y `teacher`.
- Página de inicio con información del proyecto.
- Acceso a `Cuenta`, `Clases` y `Diseños`.
- Creación de clases para profesores.
- Unirse a clases como estudiante.
- Editor de diagramas con arrastrar y soltar, conexión de elementos y exportación a PNG.
- Guardado de diseños en la base de datos.
- Guardar diseños en una clase para que otros usuarios puedan copiarlos.

## Nota

El backend usa SQLite en `backend/data/database.sqlite`. Si necesitas reiniciar la base de datos, puedes borrar ese archivo y reiniciar el servidor.
