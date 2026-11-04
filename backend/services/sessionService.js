const crypto = require('crypto');

/**
 * Equivalente a session_start() de PHP (sesiones en memoria, cookie PHPSESSID).
 * Se usa en el login por formulario y en google_auth.php (state OAuth),
 * igual que en los scripts PHP.
 */

const COOKIE_NAME = 'PHPSESSID';
const SESSION_TTL_MS = 20 * 60 * 1000; // PHP: session.gc_maxlifetime = 1440 s

const store = new Map();

function parseCookies(req) {
  const header = req.headers && req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}

function purgeExpired() {
  const now = Date.now();
  for (const [sid, data] of store) {
    if (data.expires <= now) store.delete(sid);
  }
}

/**
 * Equivale a session_start(): carga la sesión de la cookie o crea una nueva
 * y renueva la cookie (Path=/, HttpOnly), como hace PHP.
 */
function start(req, res) {
  purgeExpired();

  const cookies = parseCookies(req);
  let sid = cookies[COOKIE_NAME];
  let data = sid ? store.get(sid) : null;

  if (!data || data.expires <= Date.now()) {
    sid = crypto.randomBytes(16).toString('hex');
    data = { expires: Date.now() + SESSION_TTL_MS };
    store.set(sid, data);
  }

  data.expires = Date.now() + SESSION_TTL_MS;
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${sid}; Path=/; HttpOnly; SameSite=Lax`);

  req.session = data;
  return req.session;
}

module.exports = { start };
