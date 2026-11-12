# Despliegue en VPS (Nginx + Node + Let's Encrypt)

Sitio: `diagramtec.qd.je` (y `www`). API: `api.diagramtec.qd.je` (Node en `127.0.0.1:4002`).
El DNS lo maneja DigitalPlat y el tráfico llega directo al VPS. No se usa Cloudflare como proxy: el plan Free no acepta
`diagramtec.qd.je` porque `qd.je` no está en la Public Suffix List. HTTPS con Let's Encrypt. La base es Supabase (externa).

## Contenido

| Archivo | Qué hace |
|---|---|
| `setup.sh` | Preparación única del servidor (paquetes, usuario, firewall, fail2ban, SSH, certificado, nginx, systemd). |
| `deploy.sh` | Compila y sube frontend y backend, instala dependencias y reinicia la API. |
| `api.env.example` | Plantilla de `/etc/diagramtec/api.env`. |
| `nginx/diagramtec.conf` | Sitio estático + API, HTTPS y límites por IP (`limit_req`/`limit_conn`). |
| `nginx/diagramtec-proxy.conf` | Proxy hacia Node (fija `X-Forwarded-For` a la IP real). |
| `nginx/diagramtec-headers.conf` | Cabeceras de seguridad (réplica de `frontend/public/.htaccess`). |
| `systemd/diagramtec-api.service` | Servicio endurecido de la API. |

## Requisitos

- VPS con Ubuntu 22.04 o 24.04, acceso root inicial y 8 GB de RAM (sobra).
- En DigitalPlat, registros **A** de `diagramtec.qd.je`, `www.diagramtec.qd.je` y `api.diagramtec.qd.je` con la IP del VPS
  (y AAAA si el VPS tiene IPv6). Comprobá con `nslookup api.diagramtec.qd.je` antes de correr `setup.sh`.
- **Un usuario no root con sudo y tu llave pública SSH** en su `~/.ssh/authorized_keys` (hace falta para endurecer SSH).
- En tu PC: Node.js 22, `rsync` y `ssh` (Git Bash con rsync, WSL, Linux o macOS).

## 1. Orden de ejecución

1. **Subí esta carpeta al servidor** y ejecutá el setup como root (al correrlo aceptás los términos de Let's Encrypt):
   ```bash
   scp -r deploy/vps TU_USUARIO@IP_VPS:~/
   ssh TU_USUARIO@IP_VPS
   cd ~/vps && sudo CERTBOT_EMAIL=tu@correo.com bash setup.sh   # agregá SSH_PORT=2222 si tu SSH no usa el 22
   ```
   El certificado cubre los tres nombres y se renueva solo (`certbot.timer`); en cada renovación nginx se detiene unos segundos.
   **Probá el login por llave en otra terminal antes de cerrar la sesión**: `setup.sh` desactiva root y contraseñas por SSH
   (solo si encuentra una llave de un usuario no root).
2. **Completá los secretos**: `sudo -u diagramtec nano /etc/diagramtec/api.env` (`DATABASE_URL`, `JWT_SECRET`,
   `TURNSTILE_SECRET`, `GOOGLE_*`, `EMAIL_*`). Los valores de dominio y `TRUST_PROXY=1` ya vienen puestos.
3. **Desplegá** (ver abajo). El primer `deploy.sh` arranca la API.

## 2. Desplegar

`deploy.sh` funciona de dos maneras:

- **Desde tu PC (modo por defecto, `MODE=remote`)**: compila el frontend en tu máquina y sube todo por rsync/ssh.
  ```bash
  DEPLOY_HOST=IP_VPS DEPLOY_USER=TU_USUARIO bash deploy/vps/deploy.sh
  ```
  Variables opcionales: `SSH_PORT`, `SSH_KEY`. El usuario necesita `sudo` sin contraseña
  (por ejemplo `/etc/sudoers.d/deploy` con `TU_USUARIO ALL=(ALL) NOPASSWD:ALL`, o limitado a rsync, chown, find, chmod, systemctl y `sudo -u diagramtec npm`).
- **En el servidor (`MODE=local`)**: con el repo clonado ahí, `MODE=local bash deploy/vps/deploy.sh`.

El script compila `frontend/`, copia `frontend/dist` a `/var/www/diagramtec`, copia `backend/` (sin `node_modules` ni `.env`)
a `/opt/diagramtec/backend`, corre `npm ci --omit=dev` como `diagramtec` y reinicia `diagramtec-api`.

## 3. Verificación

En el VPS:

```bash
curl -fsS https://api.diagramtec.qd.je/health        # responde la API
curl -sI https://diagramtec.qd.je | grep -i -E 'content-security|strict-transport|x-frame'
sudo systemctl status diagramtec-api nginx --no-pager
sudo journalctl -u diagramtec-api -n 50 --no-pager
sudo ufw status numbered                                  # solo SSH, 80 y 443
sudo fail2ban-client status                               # sshd, nginx-http-auth, nginx-botsearch, nginx-limit-req
sudo certbot renew --dry-run                              # la renovación automática funciona
sudo nginx -t
```

Desde tu PC, el puerto de Node no debe responder: `curl --max-time 5 http://IP_VPS:4002` tiene que fallar.

## 4. Turnstile (anti-bots del login y registro)

Turnstile funciona aunque el dominio no esté en Cloudflare: el widget se crea en Cloudflare -> Turnstile con los
hostnames `diagramtec.qd.je` y `www.diagramtec.qd.je`. La **site key** va en `VITE_TURNSTILE_SITE_KEY`
(`frontend/.env.production`) y la **secret key** en `TURNSTILE_SECRET` de `/etc/diagramtec/api.env`.

## 5. Protección sin Cloudflare

Lo que antes hacía Cloudflare ahora lo hace el propio VPS:

| Antes (Cloudflare) | Ahora (VPS) |
|---|---|
| Rate limiting en el borde | `limit_req` de nginx: 10 req/s por IP en la API, 10/min en login, registro y recuperación, 30 req/s en el sitio; `limit_conn` por IP. Node mantiene sus propios límites por IP y por email. |
| Bloqueo de abusadores | fail2ban `nginx-limit-req`: 1 h de baneo a quien supera los límites 10 veces en 10 min; además `nginx-botsearch` y `sshd`. |
| WAF administrado | No hay equivalente gratis. Mitigado con consultas parametrizadas, validación de entradas, CSP estricta y bloqueo de archivos ocultos (403). |
| Ocultar la IP del VPS | La IP es pública. Solo están abiertos 22, 80 y 443; Node escucha en `127.0.0.1`. |
| DDoS volumétrico | Sin protección más allá de la del proveedor del VPS. Ante un ataque grande, la salida es mudar el sitio a un dominio que Cloudflare acepte (por ejemplo `*.dpdns.org`). |
| Certificado de origen | Let's Encrypt con renovación automática. |

## Notas

- **TRUST_PROXY=1**: Nginx es el único proxy. `diagramtec-proxy.conf` pisa `X-Forwarded-For` con `$remote_addr`, así el
  cliente no puede inventarse otra IP para esquivar los límites.
- Las cabeceras de seguridad del sitio están duplicadas a propósito en `diagramtec-headers.conf` (nginx no hereda `add_header` entre bloques).
  Si cambia `frontend/public/.htaccess`, actualizá ese archivo y volvé a copiarlo a `/etc/nginx/snippets/`.
- **AlmaLinux/Rocky**: usar `dnf` en vez de `apt`; `firewalld` en vez de `ufw`; `dnf-automatic` en vez de `unattended-upgrades`;
  copiar los archivos de nginx a `/etc/nginx/conf.d/` (no hay `sites-available`); servicio SSH `sshd`; con SELinux activo,
  `setsebool -P httpd_can_network_connect 1` y `restorecon -R /var/www/diagramtec`; Node.js desde
  `https://rpm.nodesource.com/setup_22.x`. `setup.sh` está escrito para Ubuntu y hay que adaptarlo.
- Si cambia el puerto SSH, exportá `SSH_PORT` al correr `setup.sh` para que ufw y fail2ban lo contemplen.
