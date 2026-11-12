#!/usr/bin/env bash
# Preparación inicial del VPS para DiagramTec (Ubuntu 22.04/24.04).
# Se corre UNA vez como root desde esta carpeta, con los DNS ya apuntando al VPS:
#   sudo CERTBOT_EMAIL=tu@correo.com bash setup.sh
# Es idempotente: se puede repetir sin romper nada.
#
# Si el VPS es AlmaLinux/Rocky: cambiar apt por dnf, ufw por firewalld,
# unattended-upgrades por dnf-automatic, y usar /etc/nginx/conf.d/ en vez de
# sites-available/sites-enabled (ver README.md).
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Ejecutá este script como root (sudo bash setup.sh)." >&2; exit 1; }

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_USER="diagramtec"
SSH_PORT="${SSH_PORT:-22}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
DOMAINS=(diagramtec.qd.je www.diagramtec.qd.je api.diagramtec.qd.je)
export DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------------------
# 1. Actualizar el sistema
# ---------------------------------------------------------------------------
echo "==> 1. Actualizando el sistema"
apt-get update -y
apt-get upgrade -y

# ---------------------------------------------------------------------------
# 2. Paquetes: nginx, certbot, ufw, fail2ban, unattended-upgrades, rsync, curl
# ---------------------------------------------------------------------------
echo "==> 2. Instalando paquetes"
apt-get install -y nginx certbot ufw fail2ban unattended-upgrades rsync curl ca-certificates gnupg

# Actualizaciones de seguridad automáticas
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'APT'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT
systemctl enable --now unattended-upgrades

# ---------------------------------------------------------------------------
# 3. Node.js 22 LTS (NodeSource)
# ---------------------------------------------------------------------------
echo "==> 3. Node.js 22"
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" != "22" ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

# ---------------------------------------------------------------------------
# 4. Usuario sin privilegios y carpetas
# ---------------------------------------------------------------------------
echo "==> 4. Usuario y carpetas"
if ! id "$APP_USER" >/dev/null 2>&1; then
  useradd --system --home-dir /opt/diagramtec --shell /usr/sbin/nologin "$APP_USER"
fi
mkdir -p /opt/diagramtec/backend /var/www/diagramtec /etc/diagramtec
chown -R "$APP_USER":"$APP_USER" /opt/diagramtec
chown root:root /var/www/diagramtec
chmod 755 /var/www/diagramtec /opt/diagramtec

# api.env: se copia la plantilla solo si no existe (nunca se pisan secretos reales)
chown root:"$APP_USER" /etc/diagramtec
chmod 750 /etc/diagramtec
if [ ! -f /etc/diagramtec/api.env ]; then
  install -m 600 -o "$APP_USER" -g "$APP_USER" "$DIR/api.env.example" /etc/diagramtec/api.env
  echo "    Creado /etc/diagramtec/api.env (completalo con los valores reales)."
fi
chown "$APP_USER":"$APP_USER" /etc/diagramtec/api.env
chmod 600 /etc/diagramtec/api.env

# ---------------------------------------------------------------------------
# 5. Firewall (ufw): solo SSH, HTTP y HTTPS
# ---------------------------------------------------------------------------
echo "==> 5. Firewall"
ufw default deny incoming
ufw default allow outgoing
# SSH primero, para no quedarte afuera al activar ufw
ufw allow "${SSH_PORT}/tcp" comment "ssh"
ufw allow 80/tcp comment "http (redirige y renueva certificados)"
ufw allow 443/tcp comment "https"
ufw --force enable
ufw status verbose

# ---------------------------------------------------------------------------
# 6. fail2ban (sshd y nginx)
# ---------------------------------------------------------------------------
echo "==> 6. fail2ban"
cat > /etc/fail2ban/jail.d/diagramtec.local <<F2B
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port    = ${SSH_PORT}

# Sin Cloudflare, nginx ve la IP real: estas jails bloquean de verdad.
[nginx-http-auth]
enabled = true

[nginx-botsearch]
enabled = true

# Banea 1 h a quien supera los limit_req de nginx 10 veces en 10 minutos.
[nginx-limit-req]
enabled  = true
logpath  = /var/log/nginx/error.log
maxretry = 10
F2B
systemctl enable fail2ban
systemctl restart fail2ban

# ---------------------------------------------------------------------------
# 7. Endurecer SSH (con verificación previa de llaves)
# ---------------------------------------------------------------------------
echo "==> 7. Endurecimiento de SSH"
cat <<'AVISO'

  ##########################################################################
  #  ATENCIÓN: se va a desactivar el login de root y las contraseñas SSH.  #
  #  Solo se aplica si hay una llave pública en el authorized_keys de un   #
  #  usuario NO root. Probá tu llave en OTRA terminal antes de cerrar la   #
  #  sesión actual, o podés quedarte sin acceso.                           #
  ##########################################################################

AVISO
HAS_KEY=0
while IFS=: read -r user _ uid _ _ home _; do
  if [ "$uid" -ge 1000 ] && [ "$user" != "root" ] && [ "$user" != "nobody" ]; then
    keys="$home/.ssh/authorized_keys"
    if [ -s "$keys" ] && grep -Eq '^(ssh-|ecdsa-|sk-)' "$keys"; then
      echo "    Llave encontrada para el usuario: $user"
      HAS_KEY=1
    fi
  fi
done < /etc/passwd

if [ "$HAS_KEY" -eq 1 ]; then
  mkdir -p /etc/ssh/sshd_config.d
  # El prefijo 00- hace que gane sobre otros drop-ins (por ej. cloud-init con PasswordAuthentication yes)
  cat > /etc/ssh/sshd_config.d/00-diagramtec-hardening.conf <<'SSHD'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
MaxAuthTries 3
SSHD
  if sshd -t; then
    systemctl reload ssh 2>/dev/null || systemctl reload sshd
    echo "    SSH endurecido."
  else
    rm -f /etc/ssh/sshd_config.d/00-diagramtec-hardening.conf
    echo "    AVISO: sshd -t falló; se revirtió el endurecimiento." >&2
  fi
else
  echo "    NO SE APLICÓ el endurecimiento de SSH: no hay ninguna llave en el"
  echo "    ~/.ssh/authorized_keys de un usuario no root. Creá un usuario con sudo,"
  echo "    agregale tu llave pública y volvé a correr este script."
fi

# ---------------------------------------------------------------------------
# 8. Servicio systemd de la API
# ---------------------------------------------------------------------------
echo "==> 8. Servicio systemd"
install -m 644 "$DIR/systemd/diagramtec-api.service" /etc/systemd/system/diagramtec-api.service
systemctl daemon-reload
systemctl enable diagramtec-api
echo "    El servicio se inicia en el primer deploy.sh (todavía no hay código)."

# ---------------------------------------------------------------------------
# 9. Sitio de nginx
# ---------------------------------------------------------------------------
echo "==> 9. Certificado HTTPS (Let's Encrypt) y nginx"
CERT="/etc/letsencrypt/live/${DOMAINS[0]}/fullchain.pem"
if [ ! -f "$CERT" ]; then
  if [ -z "$CERTBOT_EMAIL" ]; then
    echo "    Falta CERTBOT_EMAIL. Volvé a correr: sudo CERTBOT_EMAIL=tu@correo.com bash setup.sh" >&2
    exit 1
  fi
  # standalone: certbot usa el puerto 80 un momento. Los hooks quedan guardados y se
  # repiten en cada renovación automática (certbot.timer, cada ~60 días).
  certbot certonly --standalone --non-interactive --agree-tos -m "$CERTBOT_EMAIL"     --pre-hook "systemctl stop nginx" --post-hook "systemctl start nginx"     $(printf -- '-d %s ' "${DOMAINS[@]}") || {
      echo "    No se pudo obtener el certificado. Revisá que los registros A de" >&2
      echo "    ${DOMAINS[*]} apunten a la IP de este VPS y repetí setup.sh." >&2
      exit 1
    }
fi

mkdir -p /etc/nginx/snippets
install -m 644 "$DIR/nginx/diagramtec-headers.conf" /etc/nginx/snippets/diagramtec-headers.conf
install -m 644 "$DIR/nginx/diagramtec-proxy.conf" /etc/nginx/snippets/diagramtec-proxy.conf
install -m 644 "$DIR/nginx/diagramtec.conf" /etc/nginx/sites-available/diagramtec.conf
ln -sfn /etc/nginx/sites-available/diagramtec.conf /etc/nginx/sites-enabled/diagramtec.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx
echo "    nginx recargado con HTTPS."

echo
echo "Listo. Próximos pasos: completar /etc/diagramtec/api.env y correr deploy.sh."
