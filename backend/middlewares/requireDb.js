function requireDb(req, res, next) {
  if (!req.app.locals.dbReady) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  next();
}

module.exports = requireDb;
