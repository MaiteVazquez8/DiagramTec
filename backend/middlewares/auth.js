const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_OPTIONS = { algorithms: ['HS256'] };
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_HOURS = 24;
// __Host-: el navegador exige Secure, Path=/ y sin Domain (no la pueden pisar subdominios).
const SESSION_COOKIE = IS_PROD ? '__Host-dt_session' : 'dt_session';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { algorithm: 'HS256', expiresIn: `${SESSION_HOURS}h` });
}

function readCookie(req, name) {
  const pair = (req.headers.cookie || '').split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

const sessionCookieOptions = { httpOnly: true, secure: IS_PROD, sameSite: 'lax', path: '/' };

/** La sesión vive en una cookie HttpOnly: JavaScript (y un XSS) no la puede leer. */
function setSessionCookie(res, user) {
  res.cookie(SESSION_COOKIE, signToken(user), { ...sessionCookieOptions, maxAge: SESSION_HOURS * 3600 * 1000 });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions);
}

function hasSessionCookie(req) {
  return Boolean(readCookie(req, SESSION_COOKIE));
}

/**
 * Verifica el JWT (cookie de sesión, o "Bearer" para clientes de API) y vuelve a leer el
 * usuario de la base: borrar, degradar o cambiar la contraseña corta las sesiones al instante.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = readCookie(req, SESSION_COOKIE)
    || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, JWT_OPTIONS);
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    const [rows] = await req.app.locals.db.execute(
      'SELECT id, role, password_changed_at, email_verified_at FROM users WHERE id = ?',
      [payload.id],
    );
    const user = rows[0];
    const changedAt = user?.password_changed_at ? Math.floor(new Date(user.password_changed_at).getTime() / 1000) : 0;
    if (!user || payload.iat < changedAt) {
      return res.status(401).json({ error: 'Sesión vencida. Iniciá sesión de nuevo.' });
    }
    req.user = { id: Number(user.id), role: user.role, emailVerified: Boolean(user.email_verified_at) };
    next();
  } catch (err) {
    next(err);
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || (req.user.role !== 'superadmin' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Acceso solo para super administradores' });
  }
  next();
}

function superadminMiddleware(req, res, next) {
  if (req.user?.role !== 'superadmin') return res.status(403).json({ error: 'Solo un superadministrador puede hacer esto' });
  next();
}

/** Clases y publicaciones exigen haber verificado el email. */
function requireVerifiedEmail(req, res, next) {
  if (!req.user?.emailVerified) {
    return res.status(403).json({ error: 'Verificá tu email para usar las clases. Revisá tu correo o pedí un enlace nuevo.', code: 'EMAIL_NOT_VERIFIED' });
  }
  next();
}

module.exports = {
  authMiddleware,
  adminMiddleware,
  superadminMiddleware,
  requireVerifiedEmail,
  signToken,
  setSessionCookie,
  clearSessionCookie,
  hasSessionCookie,
  readCookie,
  JWT_OPTIONS,
};
