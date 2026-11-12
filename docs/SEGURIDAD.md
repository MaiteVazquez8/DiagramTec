# Seguridad de DiagramTec

Revisión de seguridad de la rama `host` (la que está publicada en diagramtec.qd.je), hecha en la rama `feat/seguridad-host` en noviembre de 2026. Este documento cuenta qué fallos había, qué ataques permitían, cómo quedaron resueltos, cómo se probó y qué falta hacer fuera del código.

**Resultado:** 95 de 95 pruebas automáticas OK contra un PostgreSQL real (`npm test` en `backend/`), más pruebas manuales en el navegador (CSP de producción, registro, verificación de email, borrado de cuenta y todas las rutas con React Router 7).

---

## 1. Arquitectura y por dónde puede entrar un ataque

```
Navegador ──► diagramtec.qd.je (Apache en Hostinger: React compilado + .htaccess)
    │
    └────────► api.diagramtec.qd.je (Node/Express en Hostinger) ──► Supabase (PostgreSQL)
                    │                                              ▲
                    ├─► Cloudflare Turnstile (siteverify)          │ API REST pública de Supabase
                    ├─► Google OAuth                               │ (clave "anon", accesible por cualquiera)
                    └─► Gmail SMTP (códigos de recuperación)       │
                                                                   └── superficie que estaba abierta
```

Superficies de ataque: el sitio estático, la API Node, la API REST pública de Supabase, el flujo de Google, el correo de recuperación y el propio repositorio de GitHub (secretos subidos).

---

## 2. Qué ataques previene la página y cómo estaba antes

Gravedad: 🔴 crítica · 🟠 alta · 🟡 media.

| # | Ataque | Gravedad | Cómo estaba antes | Qué hace ahora | Dónde |
|---|--------|----------|-------------------|----------------|-------|
| 1 | **Lectura y modificación de toda la base por la API pública de Supabase** | 🔴 | `supabase.sql` creaba políticas RLS `USING (true)` en las 5 tablas: con la clave pública `anon` cualquiera podía leer emails y hashes de contraseña, y borrar o editar todo. | RLS activo **sin** políticas; el backend borra las `dev_all_*` al arrancar. La API REST pública ya no ve nada. El backend usa el rol `postgres`, que no depende de RLS. | `backend/db.js` (`ensureSchema`), `documents/db/supabase.sql` |
| 2 | **Uso de secretos publicados en el repo** | 🔴 | `php/.env` con `GOOGLE_CLIENT_SECRET` y la contraseña de Gmail estaban en git. | Se borró `php/` y los paquetes viejos de `hostinger/`; `.env` y `*.pem` en `.gitignore`. **Hay que rotar los secretos** (sección 6): siguen en el historial. | `.gitignore` |
| 3 | **Falsificación de tokens de administrador** | 🔴 | `JWT_SECRET` tenía un valor por defecto publicado en el repo; si producción lo usaba, cualquiera podía firmarse un token de superadmin. | En producción la API **no arranca** sin un secreto de 32+ caracteres ni con el valor viejo. Solo se acepta HS256 (rechaza `alg: none`). | `backend/server.js`, `middlewares/auth.js` |
| 4 | **Toma de cualquier cuenta adivinando el código de recuperación** | 🔴 | Código de 6 dígitos con `Math.random`, sin vencimiento ni límite de intentos; al usarlo se generaba otro **que seguía valiendo para siempre**. Con ~1 millón de intentos se entraba a cualquier cuenta. | Código con `crypto.randomInt`, guardado como HMAC-SHA256, vence en 15 min, máximo 5 intentos (contados de forma atómica), un solo uso, más límite por IP y Turnstile. | `services/authService.js`, `repositories/userRepository.js`, `routes/auth.js` |
| 5 | **Escalada de privilegios** | 🔴 | Un `admin` podía ascender a cualquiera a `superadmin` o editar o borrar superadmins; editar un usuario sin mandar el rol lo dejaba como alumno. | Solo un superadmin toca cuentas o roles `admin`/`superadmin`; nadie se cambia su propio rol; si no se manda rol, se conserva. El registro solo permite `student`/`teacher`. | `services/adminService.js` |
| 6 | **XSS almacenado (robo de sesión)** | 🟠 | Al descargar un PDF se hacía `link.href = design.pdf_data`; guardando `javascript:...` por la API se ejecutaba código en el navegador de quien descargara y se robaba su token. | El servidor solo acepta `data:image/png|jpeg|webp` y `data:application/pdf`; el frontend también rechaza lo que no empiece con `data:`. CSP en el sitio. | `services/designService.js`, `components/ClassPost.jsx`, `pages/DesignsPage.jsx`, `.htaccess` |
| 7 | **Acceso a datos ajenos (IDOR)** | 🟠 | Cualquier usuario podía ver cualquier clase con su **código de acceso**, comentar en clases ajenas, copiar diseños privados de otros y publicar diseños en clases donde no estaba. `/classes/available` listaba los códigos de todas las clases. | Solo miembros, dueño o superadmin ven una clase y su código, y comentan; copiar exige el mismo permiso que ver; publicar en una clase exige ser profesor de esa clase. | `controllers/classesController.js`, `services/classService.js`, `services/designService.js`, `repositories/classRepository.js` |
| 8 | **Robo previo de cuenta (pre-hijacking) con Google** | 🟠 | Alguien registraba con contraseña el email de otra persona (los emails no se verifican). Cuando el dueño real entraba con Google, se vinculaba a esa cuenta y el atacante conservaba su contraseña. | Al vincular Google a una cuenta existente se borra la contraseña y se cortan sus sesiones. Una cuenta ya vinculada no acepta otra identidad de Google. | `repositories/userRepository.js` (`setGoogleId`), `services/authService.js` |
| 9 | **Login CSRF con Google** | 🟠 | El `state` era un JWT válido para cualquier navegador: un atacante podía hacer que la víctima quedara logueada en la cuenta del atacante. | El `state` además va en una cookie HttpOnly, SameSite=Lax del navegador que inició el login; si no coincide, se rechaza. Se exige email verificado por Google. | `controllers/authController.js`, `services/googleAuthService.js` |
| 10 | **Fuga del token por la URL** | 🟡 | Google redirigía a `/login?token=...`: el token quedaba en el historial, en los logs y en el `Referer`. | El token va en el fragmento (`#token=`), que nunca sale del navegador. | `services/googleAuthService.js`, `pages/LoginPage.jsx` |
| 11 | **Sesiones que sobreviven** | 🟡 | Un JWT de 48 h seguía valiendo aunque el usuario fuera borrado, degradado o cambiara la contraseña. | JWT de 24 h; en cada pedido se relee el usuario y se rechazan los tokens anteriores al último cambio de contraseña. | `middlewares/auth.js` |
| 12 | **Fuerza bruta de contraseñas y credential stuffing** | 🟡 | Sin límite de intentos. | Límite por IP+email (8 / 15 min) y por IP (100 / 15 min), con `Retry-After`; Turnstile en login. | `middlewares/security.js`, `routes/auth.js` |
| 13 | **Bots: altas masivas y spam de correos** | 🟡 | Nada los frenaba. | Cloudflare Turnstile en registro, login y recuperación, validado en el servidor (`siteverify`) con acción y hostname. En producción se rechazan las claves de prueba. | `middlewares/security.js` (`turnstile`), `components/Turnstile.jsx` |
| 14 | **Enumeración de usuarios** | 🟡 | La recuperación respondía "El correo no existe"; el login tardaba distinto según existiera el usuario. | Misma respuesta y tiempo exista o no el correo (el correo se envía en segundo plano; login con hash de relleno). | `services/authService.js`, `controllers/authController.js` |
| 15 | **Fuerza bruta de códigos de clase** | 🟡 | Sin límite. | 20 intentos de unirse cada 15 min por usuario. | `routes/classes.js` |
| 16 | **Inyección SQL** | 🟡 | Las consultas ya eran parametrizadas (bien), pero un id como `1 OR 1=1` llegaba a la base y devolvía 500; la conexión permitía varias sentencias por consulta en la rama MySQL. | Ids validados (`router.param`) → 400 antes de tocar la base. Pruebas con `' OR '1'='1` y `DROP TABLE`. | `middlewares/security.js` (`validateIdParam`), routers |
| 17 | **Denegación de servicio por cuerpos grandes** | 🟡 | 50 MB de JSON y formularios aceptados en todas las rutas. | 100 KB en general y 15 MB solo en `/designs` (imagen y PDF). | `server.js` |
| 18 | **CORS abierto** | 🟡 | Sin `FRONTEND_URL` se aceptaba cualquier origen con credenciales. | Lista blanca obligatoria en producción. | `server.js` |
| 19 | **Clickjacking, MIME sniffing, inyección de scripts** | 🟡 | Solo `nosniff` en el sitio. | API: `X-Frame-Options`, `nosniff`, CSP `default-src 'none'`, `Referrer-Policy`, HSTS en producción, sin `X-Powered-By`. Sitio: CSP estricta, HSTS, `X-Frame-Options`, `Permissions-Policy`, HTTPS forzado, bloqueo de archivos ocultos y sin listado de carpetas. | `middlewares/security.js`, `hostinger/public_html/.htaccess`, `frontend/public/.htaccess` |
| 20 | **Superficie PHP** | 🟡 | Proxy genérico `/php/*` hacia cualquier `.php`, `display_errors=1` y errores SQL devueltos al cliente, CORS que reflejaba cualquier origen. | PHP eliminado; todo el auth vive en Node. | `php/` (borrado), `routes/phpProxy.js` (borrado) |
| 21 | **Dependencias con vulnerabilidades conocidas** | 🟡 | Backend: 7 (1 crítica en `proxy-addr`, falsificación de IP). | Backend: 0 (`npm audit`). Se quitaron `axios` y `concurrently`; `nodemailer` y `express` actualizados. | `backend/package.json` |
| 22 | **Intercepción de la conexión a la base (MITM)** | 🟡 | SSL sin verificar el certificado. | Opción `DB_SSL_CA` para verificar el certificado de Supabase (si falta, avisa en el log). | `backend/db.js` |

---

## 3. Pruebas

### 3.1 Pruebas automáticas (`npm test`)

```bash
cd backend
npm install
npm test
```

El script `backend/tests/security.e2e.mjs`:

1. Levanta un **PostgreSQL real** y efímero con `embedded-postgres` (no toca Supabase).
2. Aplica `documents/db/supabase.sql` y simula una base vieja: columna `token` y las 5 políticas abiertas `dev_all_*`.
3. Arranca el backend real (`server.js`) y le hace pedidos HTTP como un atacante.
4. Arranca más instancias para probar Turnstile rechazado por Cloudflare y el **modo producción**.
5. Al final borra la base temporal.

Requiere internet para hablar con `challenges.cloudflare.com`, con las claves de prueba oficiales de Turnstile.

**Última corrida: 66/66 OK.**

| Área | Prueba | Resultado |
|------|--------|-----------|
| Supabase | Migración al arrancar agrega las columnas de recuperación | ✅ |
| Supabase | Borra las políticas RLS abiertas `dev_all_*` | ✅ |
| Supabase | RLS activo en las 5 tablas | ✅ |
| Bots | Registro sin token de Turnstile → 403 | ✅ |
| Bots | Token rechazado por Cloudflare (siteverify) → 403 | ✅ |
| Bots | En producción no se aceptan las claves de prueba de Turnstile | ✅ |
| Contraseñas | Contraseña débil (6 caracteres) → 400 | ✅ |
| Contraseñas | Se guarda con bcrypt | ✅ |
| Validación | Email inválido → 400 | ✅ |
| Validación | Comentario de más de 2000 caracteres → 400 | ✅ |
| Registro | Registro válido devuelve token | ✅ |
| Login | Login correcto | ✅ |
| Login | Cuenta solo-Google con contraseña → 401 (antes 500) | ✅ |
| Fuerza bruta | 9 intentos fallidos sobre la misma cuenta → 429 | ✅ |
| Fuerza bruta | Tras 5 códigos de recuperación erróneos, ni el correcto sirve | ✅ |
| Fuerza bruta | Probar códigos de clase en masa → 429 | ✅ |
| Enumeración de usuarios | Misma respuesta exista o no el correo | ✅ |
| Recuperación | El código se guarda como HMAC, no en texto plano | ✅ |
| Recuperación | Código vencido → 400 | ✅ |
| Recuperación | Código válido cambia la contraseña | ✅ |
| Recuperación | El código es de un solo uso | ✅ |
| Recuperación | Login con la contraseña nueva | ✅ |
| Sesiones | Cambiar la contraseña revoca los tokens anteriores | ✅ |
| Sesiones | El rol nuevo se aplica sin volver a iniciar sesión | ✅ |
| Sesiones | El token de un usuario borrado deja de valer | ✅ |
| Falsificación de tokens | Token firmado con el secreto viejo publicado → 401 | ✅ |
| Falsificación de tokens | Token con `alg: none` → 401 | ✅ |
| Falsificación de tokens | En producción no arranca con un `JWT_SECRET` débil | ✅ |
| Escalada de privilegios | No se puede registrar como superadmin | ✅ |
| Escalada de privilegios | Un alumno no puede crear clases | ✅ |
| Escalada de privilegios | Un alumno no publica en una clase al crear un diseño | ✅ |
| Escalada de privilegios | Un alumno no entra al panel admin | ✅ |
| Escalada de privilegios | Un admin no puede ascender a superadmin | ✅ |
| Escalada de privilegios | Un admin no puede borrar a un superadmin | ✅ |
| Administración | Editar sin mandar rol no lo cambia | ✅ |
| Administración | Un superadmin sí puede cambiar roles | ✅ |
| IDOR / fuga de datos | `/classes/available` no expone códigos de clase | ✅ |
| IDOR / fuga de datos | Un no miembro no ve la clase ni su código | ✅ |
| IDOR / fuga de datos | Un no miembro no puede comentar | ✅ |
| IDOR / fuga de datos | Un no miembro no ve los miembros | ✅ |
| IDOR / fuga de datos | Ver un diseño privado ajeno → 403 | ✅ |
| IDOR / fuga de datos | Copiar un diseño privado ajeno → 403 | ✅ |
| IDOR / fuga de datos | Editar o borrar un diseño ajeno → 403 | ✅ |
| Clases | Unirse con el código | ✅ |
| Clases | Un miembro ve la clase y comenta | ✅ |
| Diseños | El profesor crea un diseño | ✅ |
| Diseños | El profesor publica en su clase con un PDF válido | ✅ |
| Diseños | Un miembro puede copiar el diseño de la clase | ✅ |
| XSS | `pdf_data` con `javascript:` → 400 | ✅ |
| XSS | `image` con `data:text/html` → 400 | ✅ |
| Inyección SQL | Un id con SQL en la ruta → 400, sin llegar a la base | ✅ |
| Inyección SQL | Login con `' OR '1'='1` → 400/401 | ✅ |
| Inyección SQL | Un comentario con `DROP TABLE` se guarda como texto y la tabla sigue | ✅ |
| Login CSRF | El inicio con Google pone una cookie de state HttpOnly, SameSite=Lax, Path=/ | ✅ |
| Login CSRF | Callback con un state válido pero sin la cookie del navegador → rechazado | ✅ |
| Robo de cuenta previo | Al vincular Google, la contraseña puesta por un tercero deja de servir | ✅ |
| Robo de cuenta previo | Y su sesión abierta se corta | ✅ |
| Robo de cuenta previo | Otra identidad de Google con el mismo email → rechazada | ✅ |
| CORS | Un origen ajeno no recibe permiso; el frontend sí | ✅ |
| CORS | En producción no arranca sin `FRONTEND_URL` | ✅ |
| Clickjacking / sniffing | `X-Frame-Options`, `nosniff`, CSP y sin `X-Powered-By` | ✅ |
| HTTPS | En producción la API envía HSTS | ✅ |
| DoS | Cuerpo de 200 KB en `/auth/login` → 413 | ✅ |
| DoS | Los diseños aceptan cuerpos grandes (1 MB) | ✅ |
| DoS | JSON malformado → 400 (sin traza interna) | ✅ |
| Superficie de ataque | El proxy PHP ya no existe | ✅ |

### 3.2 Pruebas de humo contra un servidor corriendo

`npm run test:integration` (`backend/scripts/run_integration_tests.js`): health, cabeceras, CORS, 401 sin token, token falsificado y ausencia del proxy PHP. Sirve para chequear un despliegue: `API_BASE=https://api.diagramtec.qd.je npm run test:integration`.

### 3.3 Revisión manual en el navegador

El frontend se compiló con la clave pública de prueba de Turnstile y se sirvió con **la misma CSP del `.htaccess`**. En `/login`, `/signup`, `/recover` y `/editor`:

- La app carga sin violaciones de CSP en la consola.
- El widget de Turnstile aparece y genera el token.
- Los íconos de Iconify y las fuentes de Google cargan.
- Los campos de contraseña exigen 8 caracteres.

### 3.4 Dependencias

- `npm audit` del backend: **0 vulnerabilidades**.
- `npm audit` del frontend: **0 vulnerabilidades**, tras actualizar a Vite 8.3, @vitejs/plugin-react 6.3 y React Router 7.18.

### 3.5 Base nueva en Supabase (proyecto `diagramtec`, sa-east-1)

Creada en la cuenta propia (plan Free) con el esquema de `documents/db/supabase.sql`:

- 5 tablas con RLS activo, **0 políticas** y sin permisos para los roles públicos `anon` y `authenticated` (`REVOKE ALL`).
- Ataque simulado contra la API REST pública con la clave publicable: `GET /rest/v1/users`, `/classes` y `/designs` → **401 permission denied**; `POST /rest/v1/users` creando un superadmin → **401 permission denied**.
- Asesor de seguridad de Supabase: solo el aviso informativo "RLS Enabled No Policy", que es justamente lo buscado (todo el acceso pasa por la API Node).
- La prueba automática simula también los permisos por defecto de Supabase y verifica que el backend los revoque al arrancar.
- **Usuario propio para la API (`diagramtec_api`)** en lugar de `postgres`: solo `SELECT/INSERT/UPDATE/DELETE` sobre las 5 tablas, `BYPASSRLS` y `statement_timeout` de 15 s. La contraseña se generó en la PC del desarrollador y a Supabase solo se le envió su hash SCRAM. Probado: no puede borrar ni alterar tablas, crear tablas o roles, ni leer `auth.users`. Si la URL de conexión se filtra, el daño queda limitado a los datos de la app.
- La migración al arrancar revisa antes de modificar, así funciona con un usuario que no es dueño de las tablas.
- Flujo real contra Supabase (registro, login, clase, diseño, borrar cuenta) y `npm run test:integration` (8/8) OK. Probando apareció y se corrigió un bug previo: borrar la cuenta respondía 404 aunque la borraba.

### 3.6 Qué no se pudo probar

- El **Supabase real** de producción (está en otra cuenta).
- El login con Google de punta a punta contra Google, el envío real del correo de recuperación y el despliegue en Hostinger.

---

## 4. ¿Qué ataques está recibiendo la página?

Desde el código no se ven los ataques reales en producción: hace falta acceso a los paneles. Dónde mirar:

- **VPS**: `sudo fail2ban-client status nginx-limit-req` (IPs baneadas por exceder límites), `grep 'limiting requests' /var/log/nginx/error.log` y `/var/log/nginx/access.log` (respuestas 429 y escaneos).
- **Cloudflare → Turnstile → Analytics**: cuántos desafíos se resuelven o fallan (bots).
- **Logs de la API** (`sudo journalctl -u diagramtec-api`):
  - `[turnstile]`: fallos al verificar;
  - respuestas `429`: alguien probando contraseñas o códigos;
  - `[google] Estado OAuth inválido`: posibles intentos de login CSRF;
  - `[recovery]`: pedidos de recuperación.
- **Supabase → Logs → API**: pedidos a la API REST pública. Si ves lecturas de `users` con la clave `anon` **antes** de este cambio, alguien pudo haber descargado la base: rotá las contraseñas de los usuarios.

---

## 5. Dominio, HTTPS y Turnstile

El dominio es `diagramtec.qd.je` (DigitalPlat). **No pasa por el proxy de Cloudflare**: el plan Free lo rechaza como
subdominio porque `qd.je` no está en la Public Suffix List (se probó en el panel). El tráfico llega directo al VPS.

1. **DNS (DigitalPlat):** registros A de `diagramtec.qd.je`, `www` y `api` con la IP del VPS.
2. **Servidor real:** el VPS (AlmaLinux 9) ya tiene Docker y Traefik para otros proyectos. DiagramTec corre como dos
   contenedores endurecidos (solo lectura, sin capabilities, sin root) detrás de ese Traefik. Ver `deploy/docker/README.md`.
3. **HTTPS:** certificado de Google Trust Services emitido por Traefik (Let's Encrypt limita a 50 certificados por semana
   para **todo** `qd.je` y el cupo estaba agotado), uno solo para `diagramtec.qd.je`, `www` y `api`, con renovación automática.
   HTTP redirige a HTTPS y `www` al dominio principal; HSTS en el sitio; CAA solo permite `letsencrypt.org` y `pki.goog`.
4. **Turnstile** (no necesita que el dominio esté en Cloudflare): widget **DiagramTec**, modo Managed, hostnames
   `diagramtec.qd.je` y `www.diagramtec.qd.je`. Sitekey en `VITE_TURNSTILE_SITE_KEY` (`frontend/.env.production`);
   secret en `TURNSTILE_SECRET` del `api.env` del servidor. Sin el secret, login, registro y recuperación responden 500 (falla cerrado).
5. **Reemplazo del rate limiting de Cloudflare:** límites por IP en Traefik (10 req/s en la API, **10 por minuto** en login,
   registro y recuperación, 30 req/s en el sitio), además de los límites de Node por IP y por email. `TRUST_PROXY=1`.
   Probado en producción: después de la ráfaga, el login responde 429.
6. **Lo que se pierde sin Cloudflare:** WAF administrado, mitigación de DDoS volumétrico y ocultar la IP del VPS. Si el sitio
   recibe un ataque grande, la salida es mudarlo a un dominio que Cloudflare acepte (por ejemplo `*.dpdns.org`).

---

## 6. Pendiente fuera del código (urgente)

1. **Cerrar la base ya, aunque no se despliegue todavía.** Correr en el SQL Editor de Supabase los `DROP POLICY IF EXISTS "dev_all_..."` (están al final de `documents/db/supabase.sql`).
2. **Rotar** el `GOOGLE_CLIENT_SECRET` (Google Cloud Console), la contraseña de aplicación de Gmail y el `JWT_SECRET` (cambiarlo cierra todas las sesiones). Siguen en el historial de git.
3. Si la base estuvo expuesta, considerar pedir a los usuarios que cambien su contraseña.
4. Opcional: limpiar el historial de git (`git filter-repo`). Es destructivo y requiere coordinar con todo el equipo; rotar los secretos es lo que realmente protege.

## 7. Riesgos que quedan (decisiones abiertas)

| Riesgo | Por qué queda | Mitigación actual / siguiente paso |
|--------|---------------|------------------------------------|
| El límite de intentos está en memoria | Con varias instancias cada una cuenta aparte | Límites por IP de Traefik (sección 5.5), delante de todas las instancias |
| Sin WAF ni protección DDoS de Cloudflare | `qd.je` no se puede agregar al plan Free | Límites de Traefik; mudar a `*.dpdns.org` si hace falta |
| Sin autenticación en dos pasos | No implementada | 2FA para profesores y administradores |
| Sin copias de seguridad propias | El plan Free de Supabase no incluye backups restaurables | Volcado diario (`pg_dump`) a un almacenamiento externo |

Resueltos en la sección 9: sesión en `localStorage`, registro libre como profesor, email sin verificar, acciones sensibles sin contraseña y dependencias desactualizadas del frontend.

## 9. Mejoras de cuenta implementadas

| Mejora | Ataque que previene | Dónde | Pruebas |
|--------|---------------------|-------|---------|
| **Sesión en cookie HttpOnly** (`__Host-dt_session` en producción, Secure, SameSite=Lax, 24 h). El frontend ya no guarda el token y borra el que había en `localStorage`. | Robo de la sesión con un XSS: JavaScript no puede leer la cookie. | `middlewares/auth.js`, `AuthContext.jsx`, `api.js` | Cookie HttpOnly y SameSite; el token no aparece en el cuerpo; en el navegador `document.cookie` no la ve |
| **Chequeo de origen (CSRF)**: los pedidos que modifican datos con la cookie deben venir del frontend (`Origin` en `FRONTEND_URL`). | Que otra página haga acciones en nombre del usuario logueado. | `middlewares/security.js` (`requireSameOrigin`) | Otro origen → 403; sin Origin → 403 |
| **Cerrar sesión en el servidor** (`POST /auth/logout`). | Cookies que quedan vivas al salir. | `controllers/authController.js` | La cookie se borra |
| **Verificación de email**: enlace de 24 h (solo se guarda su sha256). Sin verificar no se puede crear, unirse ni comentar en clases, ni publicar diseños en ellas. Las cuentas de Google y las existentes se dan por verificadas. | Cuentas con emails ajenos o inventados. | `services/authService.js`, `routes/classes.js`, aviso en `App.jsx` | Sin verificar → 403; enlace inventado → inválido; enlace válido → verificado |
| **Contraseña actual para acciones sensibles**: cambiar el email, cambiar la contraseña y borrar la cuenta. El email nuevo queda pendiente hasta confirmarlo desde ese correo y se avisa al anterior. Límite de 10 intentos cada 15 min. | Quedarse con una cuenta usando una sesión robada. | `services/authService.js`, `EditProfilePage.jsx`, `AccountPage.jsx` | Sin contraseña → 400; incorrecta → 401; email pendiente hasta confirmar; borrar con contraseña → 204 |
| **Cambiar la contraseña desde el perfil**: antes la página la mandaba pero el backend la ignoraba. Ahora funciona, corta las otras sesiones y renueva la del navegador. | Bug funcional con impacto en seguridad. | `services/authService.js` | Login con la nueva; sesión vieja → 401; la renovada → 200 |
| **Código de invitación para profesores**: lo genera solo un superadmin (`POST /admin/invites`), es de un solo uso, vence en 7 días y solo se guarda su hash. | Que cualquiera se dé permisos de profesor. | `services/adminService.js`, `SignupPage.jsx`, `SuperAdminTeachersPage.jsx` | Sin código o inventado → 400; válido → profesor; reutilizado → 400; un admin común no puede generarlos |
| **Frontend actualizado** a Vite 8 y React Router 7. | Alertas de esbuild (servidor de desarrollo) y de redirecciones abiertas. | `frontend/package.json` | `npm audit` 0; build OK; todas las rutas probadas en el navegador |

**Configuración del VPS** (en `deploy/vps/`, para HostGator con Ubuntu): Nginx con las mismas cabeceras y CSP, la API como servicio systemd endurecido y con un usuario sin privilegios, HTTPS con Let's Encrypt, límites por IP en nginx, firewall con solo 22/80/443, fail2ban (incluye baneo por exceso de pedidos), SSH solo con llave, actualizaciones automáticas y scripts de instalación y despliegue. Ver `deploy/vps/README.md`.

---

## 8. Archivos tocados

- **Backend:**
  - `server.js`, `db.js`;
  - `middlewares/` (`auth.js`, `security.js` nuevo, `errorHandler.js`, `waitForDb.js`);
  - `routes/` (`auth.js`, `classes.js`, `designs.js`, `comments.js`, `admin.js`);
  - `controllers/` (`auth`, `classes`, `designs`, `admin`);
  - `services/` (`auth`, `googleAuth`, `class`, `design`, `admin`);
  - `repositories/` (`user`, `class`);
  - `seed_admin.js` (sin contraseña fija), `tests/security.e2e.mjs` (nuevo), `scripts/run_integration_tests.js`, `.env.example`, `package.json`.
- **Frontend:**
  - `components/Turnstile.jsx` (nuevo);
  - páginas `Login`, `Signup`, `RecoverPassword`, `ResetPassword` y `Designs`, componente `ClassPost`;
  - `utils/googleAuth.js`, `vite.config.js`, `public/.htaccess`, `.env*`;
  - borrado `authApi.js`.
- **Despliegue:** `hostinger/public_html/.htaccess`, `hostinger/node.env.example`, `hostinger/site.env*`, `scripts/build-hostinger.mjs`, `scripts/generate-hostinger-node-env.mjs`.
- **Borrado:** `php/`, `backend/routes/phpProxy.js`, `backend/controllers/phpController.js`, `backend/database/schema.sql` (MySQL), los paquetes generados de `hostinger/diagramtec-*`.
