const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_OPTIONS = { algorithms: ['HS256'] };

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '24h' });
}

/**
 * Verifica el JWT y vuelve a leer el usuario de la base: así un usuario borrado,
 * degradado o que cambió la contraseña pierde las sesiones viejas al instante.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  let payload;
  try {
    payload = jwt.verify(authHeader.slice(7), JWT_SECRET, JWT_OPTIONS);
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    const [rows] = await req.app.locals.db.execute(
      'SELECT id, role, password_changed_at FROM users WHERE id = ?',
      [payload.id],
    );
    const user = rows[0];
    const changedAt = user?.password_changed_at ? Math.floor(new Date(user.password_changed_at).getTime() / 1000) : 0;
    if (!user || payload.iat < changedAt) {
      return res.status(401).json({ error: 'Sesión vencida. Iniciá sesión de nuevo.' });
    }
    req.user = { id: Number(user.id), role: user.role };
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

module.exports = {
  authMiddleware,
  adminMiddleware,
  signToken,
  JWT_OPTIONS,
};
