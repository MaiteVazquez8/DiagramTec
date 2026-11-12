#!/usr/bin/env bash
# Despliega DiagramTec: compila el frontend, sincroniza frontend/dist y backend, e instala dependencias.
#
# Dos modos (variable MODE):
#   MODE=remote (por defecto): se corre desde la PC del desarrollador (Git Bash/WSL/Linux/macOS).
#                              Usa rsync y ssh contra el VPS.
#   MODE=local:                se corre en el propio servidor (repo clonado ahí), como usuario con sudo.
#
# Variables:
#   DEPLOY_HOST   IP o dominio del VPS (obligatoria en modo remote)
#   DEPLOY_USER   usuario SSH con sudo sin contraseña (por defecto: deploy)
#   SSH_PORT      puerto SSH (por defecto: 22)
#   SSH_KEY       ruta a la llave privada (opcional)
#
# Ejemplo:  DEPLOY_HOST=203.0.113.10 DEPLOY_USER=santi bash deploy/vps/deploy.sh
set -euo pipefail

MODE="${MODE:-remote}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
SSH_PORT="${SSH_PORT:-22}"
SSH_KEY="${SSH_KEY:-}"
APP_USER="diagramtec"
WEB_DIR="/var/www/diagramtec"
APP_DIR="/opt/diagramtec/backend"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# --- Cómo ejecutar comandos y copiar archivos según el modo ---
# sync_dir [opciones de rsync] ORIGEN/ DESTINO/
if [ "$MODE" = "remote" ]; then
  [ -n "$DEPLOY_HOST" ] || { echo "Falta DEPLOY_HOST (ej: DEPLOY_HOST=203.0.113.10)." >&2; exit 1; }
  SSH_OPTS=(-p "$SSH_PORT" -o StrictHostKeyChecking=accept-new)
  if [ -n "$SSH_KEY" ]; then SSH_OPTS+=(-i "$SSH_KEY"); fi
  RSYNC_SSH="ssh ${SSH_OPTS[*]}"
  # "sudo rsync" en el destino para poder escribir en /var/www y /opt
  sync_dir() {
    local dest="${!#}" args=("${@:1:$#-1}")
    rsync -az --delete -e "$RSYNC_SSH" --rsync-path="sudo rsync" "${args[@]}" "$DEPLOY_USER@$DEPLOY_HOST:$dest"
  }
  run() { ssh "${SSH_OPTS[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "$1"; }
else
  SUDO=""
  if [ "$(id -u)" -ne 0 ]; then SUDO="sudo"; fi
  sync_dir() { $SUDO rsync -a --delete "$@"; }
  run() { bash -c "$1"; }
fi

# 1. Compilar el frontend
echo "==> Compilando el frontend"
cd "$ROOT/frontend"
if [ ! -d node_modules ]; then npm ci; fi
npm run build
[ -f dist/index.html ] || { echo "No se generó frontend/dist/index.html" >&2; exit 1; }

# 2. Sitio estático
echo "==> Copiando frontend/dist a $WEB_DIR"
sync_dir "$ROOT/frontend/dist/" "$WEB_DIR/"

# 3. Backend (sin node_modules ni .env, que quedan en el servidor)
echo "==> Copiando backend a $APP_DIR"
sync_dir \
  --exclude 'node_modules' --exclude '.env' --exclude '.env.*' --exclude '*.log' --exclude '.git' \
  "$ROOT/backend/" "$APP_DIR/"

# 4. Permisos, dependencias y reinicio
echo "==> Instalando dependencias y reiniciando el servicio"
run "sudo chown -R root:root $WEB_DIR && sudo find $WEB_DIR -type d -exec chmod 755 {} + && sudo find $WEB_DIR -type f -exec chmod 644 {} +"
run "sudo chown -R $APP_USER:$APP_USER $APP_DIR"
run "cd $APP_DIR && sudo -u $APP_USER npm ci --omit=dev"
run "sudo systemctl restart diagramtec-api && sleep 2 && sudo systemctl is-active diagramtec-api"

echo "Despliegue terminado. Verificá: curl -fsS https://api.diagramtec.qd.je/health"
