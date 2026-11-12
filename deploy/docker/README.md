# Despliegue real: Docker + Traefik (VPS HostGator)

El VPS (`69.6.206.117`, AlmaLinux 9, SSH en el puerto **22022**) ya tiene Docker y un **Traefik** que atiende
80/443 para otros proyectos (glitchtec, valeria, n8n). DiagramTec se suma como dos contenedores detrás de ese Traefik,
en la red `n8n-traefik_app_network`, sin tocar lo demás. (`deploy/vps/` es para un VPS Ubuntu vacío; **no** correr
`setup.sh` en este servidor.)

| Contenedor | Qué es | Dominio |
|---|---|---|
| `diagramtec-web` | nginx sin root (8080) con `frontend/dist`, cabeceras y CSP | `diagramtec.qd.je` (`www` redirige acá) |
| `diagramtec-api` | Node 22 (3000), imagen desde `backend/Dockerfile` | `api.diagramtec.qd.je` |

Ambos corren con sistema de archivos de solo lectura, sin capabilities, `no-new-privileges` y límite de memoria.

## En el servidor

```
/opt/diagramtec/
  docker-compose.yml  web.conf  diagramtec-headers.conf
  api.env             # secretos, permisos 600 (no está en el repo)
  web/                # frontend/dist
  backend/            # código de la API (sin node_modules, .env ni tests)
```

## Actualizar

Desde la raíz del repo (Git Bash), después de `cd frontend && npm run build`:

```bash
tar -C backend --exclude=node_modules --exclude='.env' --exclude='.env.*' --exclude=tests -czf /tmp/backend.tgz .
scp -P 22022 /tmp/backend.tgz deploy/docker/docker-compose.yml deploy/docker/web.conf deploy/vps/nginx/diagramtec-headers.conf root@69.6.206.117:/tmp/
scp -P 22022 -r frontend/dist root@69.6.206.117:/tmp/web
ssh -p 22022 root@69.6.206.117 'cd /opt/diagramtec && rm -rf web backend && mv /tmp/web web && mkdir backend && tar -xzf /tmp/backend.tgz -C backend && mv /tmp/docker-compose.yml /tmp/web.conf /tmp/diagramtec-headers.conf . && chown -R root:root . && docker compose up -d --build'
```

Crear el superadmin (una vez):

```bash
ssh -p 22022 root@69.6.206.117 "docker exec -it -e ADMIN_EMAIL=vos@correo.com -e ADMIN_PASSWORD='Clave-Fuerte-123' diagramtec-api node seed_admin.js"
```

## HTTPS

Certificado de **Google Trust Services** (resolver `gts` de Traefik, validación HTTP en el puerto 80), uno solo para
`diagramtec.qd.je`, `www` y `api`; se renueva solo. No se usa Let's Encrypt (`le`) porque limita a 50 certificados por
semana para **todo** `qd.je` (dominio compartido que no está en la Public Suffix List) y ese cupo vive agotado.

Para eso se agregó a `/opt/n8n-traefik/docker-compose.yml` (hay copia `docker-compose.yml.bak-*` al lado):

```
--certificatesresolvers.gts.acme.caserver=https://dv.acme-v02.api.pki.goog/directory
--certificatesresolvers.gts.acme.email=...
--certificatesresolvers.gts.acme.storage=/letsencrypt/acme-gts.json
--certificatesresolvers.gts.acme.httpchallenge=true
--certificatesresolvers.gts.acme.httpchallenge.entrypoint=web
--certificatesresolvers.gts.acme.eab.kid=...           # proyecto de Google Cloud "DiagramTec"
--certificatesresolvers.gts.acme.eab.hmacencoded=...   # gcloud publicca external-account-keys create
```

El registro CAA del dominio permite `letsencrypt.org` y `pki.goog`. Los demás proyectos siguen usando `le`.

## Protección

- Límites por IP en Traefik: 10 req/s en la API (ráfaga 40), **10 por minuto** en login, registro y recuperación, 30 req/s en el sitio.
  Node mantiene además sus propios límites por IP y por email.
- `TRUST_PROXY=1`: Traefik es el único proxy delante de Node.
- Archivos ocultos → 403; CORS solo para `https://diagramtec.qd.je`; cookie `__Host-` con Secure/HttpOnly/SameSite.
