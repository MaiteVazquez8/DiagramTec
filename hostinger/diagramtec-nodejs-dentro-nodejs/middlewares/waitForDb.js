/**
 * Espera a que la DB esté lista (arranque en Hostinger) antes de responder 503.
 */
function waitForDb(options = {}) {
  return async function waitForDbMiddleware(req, res, next) {
    if (req.app.locals.dbReady) {
      return next();
    }

    const timeoutMs = Number(process.env.DB_WAIT_MS || 20000);
    const intervalMs = 250;
    const start = Date.now();

    while (!req.app.locals.dbReady) {
      if (Date.now() - start >= timeoutMs) {
        if (options.redirectOnTimeout) {
          const frontendUrl = (process.env.FRONTEND_URL || 'https://diagramtec.com').replace(/\/$/, '');
          return res.redirect(`${frontendUrl}/login?error=db_unavailable`);
        }
        return res.status(503).json({ error: 'Base de datos no disponible' });
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return next();
  };
}

module.exports = waitForDb;
