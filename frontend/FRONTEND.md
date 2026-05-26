# DiagramTec — Frontend

Aplicación React (Vite) para crear diagramas de flujo, guardarlos en la nube y compartirlos en clases.

## Stack

| Tecnología | Uso |
|------------|-----|
| React 18 | UI y estado local |
| React Router 6 | Rutas y navegación |
| Vite | Build y dev server |
| Axios | HTTP hacia API Node (`/api`) y auth PHP (`/php-auth`) |
| html2canvas + jsPDF | Captura de lienzo y exportación PDF |
| Iconify (`@iconify/react`) | Iconos vía `components/Icon.jsx` |

## Estructura de carpetas

```
src/
├── main.jsx              # Punto de entrada: monta App y carga styles.css
├── App.jsx               # Router, header global, rutas protegidas
├── AuthContext.jsx       # Sesión JWT (token en localStorage)
├── api.js                # Cliente REST autenticado → backend Node
├── authApi.js            # Login/registro → proxy PHP
├── styles.css            # Estilos globales (design system + Figma)
│
├── pages/                # Una pantalla por ruta
│   ├── HomePage.jsx
│   ├── LoginPage.jsx / SignupPage.jsx
│   ├── DesignsPage.jsx
│   ├── EditorPage.jsx    # Editor de diagramas (núcleo)
│   ├── ClassesPage.jsx
│   ├── ClassDetailPage.jsx
│   ├── SuperAdminPage.jsx
│   ├── AccountPage.jsx
│   └── NotFoundPage.jsx
│
├── components/           # UI reutilizable
│   ├── Icon.jsx
│   ├── EditorSidebar.jsx / EditorToolbar.jsx / EditorSubToolbar.jsx
│   ├── RenderShape.jsx / DiagramShapes.jsx
│   ├── ClassPost.jsx
│   ├── SuperAdminSidebar.jsx
│   └── ...
│
└── design/               # Lógica del editor (sin React)
    ├── constants/        # Lienzo, zoom, paleta de formas
    ├── models/           # Formas, conexiones, estado del diagrama
    ├── math/             # Geometría, zoom, bounds, líneas
    ├── operations/       # Historial undo/redo, CRUD de formas
    ├── export/           # Captura PNG/PDF
    └── index.js          # API pública del módulo design
```

## Rutas

| Ruta | Página | Acceso |
|------|--------|--------|
| `/` | Inicio | Público |
| `/login`, `/signup` | Auth | Público |
| `/designs` | Mis diseños | Público (invitado sin lista) |
| `/editor`, `/editor/:id` | Editor | Público (guardar requiere login) |
| `/classes` | Listado de clases | Login |
| `/classes/:id` | Detalle clase + publicaciones | Login |
| `/account` | Cuenta | Login |
| `/superadmin` | Panel admin | Rol `superadmin` |

## Flujo de autenticación

1. `LoginPage` / `SignupPage` llaman a `authApi` (`/php-auth`).
2. El token JWT se guarda con `AuthProvider.login()` → `localStorage.tecdiagram_token`.
3. `api.js` adjunta `Authorization: Bearer` en cada petición a `/api`.
4. Al cargar la app, `GET /api/auth/me` restaura el usuario en contexto.

## Editor de diagramas

- **Estado en** `EditorPage.jsx`: `shapes`, `connections`, `zoom`, `pan`, historial, selección.
- **Persistencia**: `PUT/POST /api/designs` con `content` JSON serializado (`serializeDiagram`).
- **Miniatura**: `captureDiagramPreview` → PNG transparente guardado en `image`.
- **PDF**: `captureDiagramHighRes` + `downloadDiagramPdf` / campo `pdf_data`.
- **UI**: paleta lateral (`EditorSidebar`), barras superior/sub (`EditorToolbar`, `EditorSubToolbar`), lienzo con pan/zoom y SVG de conexiones.

## Clases

- Profesor: crea clases, publica diseños (modal «Mis diseños» en detalle).
- Alumno: se une con código, comenta y copia diseños.
- `ClassDetailPage`: feed `ClassPost`, compositor de mensajes, modal `figma-designs-modal`.

## Estilos (`styles.css`)

Organizado por bloques (ver índice al inicio del archivo):

- Variables `:root` (crema, granate Figma, alturas de header/editor).
- Componentes globales: botones, modales, toasts, formularios.
- Sectores Figma: `.figma-sector`, tarjetas `.figma-card`, header `.figma-header`.
- Editor: sidebar granate, toolbar, lienzo, conexiones, formas.
- Admin y detalle de clase.

## Scripts

```bash
pnpm run dev      # Vite en desarrollo
pnpm run build    # Salida en dist/
pnpm run preview  # Vista previa del build
```

## Proxy de desarrollo (vite.config)

- `/api` → backend Node (diseños, clases, admin).
- `/php-auth` → Apache/Laragon para login PHP (si está configurado).
