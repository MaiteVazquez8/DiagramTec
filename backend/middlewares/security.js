const IS_PROD = process.env.NODE_ENV === 'production';

// Cabeceras de seguridad para una API JSON (no sirve HTML).
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

// ponytail: contador en memoria de un solo proceso; con varias instancias usar
// las reglas de rate limiting de Cloudflare (o Redis) en lugar de esto.
function rateLimit({ windowMs, max, key = (req) => req.ip, message = 'Demasiados intentos. Probá de nuevo en unos minutos.' }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const k = key(req);
    const now = Date.now();
    let entry = hits.get(k);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(k, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

const emailKey = (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase()}`;

// Cloudflare Turnstile: valida el token del widget antes del handler.
function turnstile(expectedAction) {
  const hostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES || '').split(',').map((h) => h.trim()).filter(Boolean),
  );

  return async (req, res, next) => {
    const secret = process.env.TURNSTILE_SECRET;
    if (!secret) {
      if (IS_PROD) return res.status(500).json({ error: 'Verificación anti-bots no configurada' });
      return next(); // en desarrollo sin claves se omite (ver .env.example)
    }

    const token = req.body?.['cf-turnstile-response'];
    if (typeof token !== 'string' || !token || token.length > 2048) {
      return res.status(403).json({ error: 'Completá la verificación anti-bots' });
    }

    let result;
    try {
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({ secret, response: token, remoteip: req.ip }),
      });
      if (!r.ok) throw new Error(`siteverify ${r.status}`);
      result = await r.json();
    } catch (err) {
      console.error('[turnstile]', err.message);
      return res.status(403).json({ error: 'No se pudo verificar que no seas un bot' });
    }

    // Las claves de prueba de Cloudflare no devuelven action ni tu hostname.
    const testKey = result.metadata?.result_with_testing_key === true;
    const ok = result.success === true && (testKey
      ? !IS_PROD
      : result.action === expectedAction && hostnames.has(result.hostname));
    if (!ok) return res.status(403).json({ error: 'Verificación anti-bots inválida. Recargá e intentá de nuevo.' });
    next();
  };
}

// router.param('id', validateIdParam): ids no numéricos → 400 en vez de llegar a la base.
function validateIdParam(req, res, next, id) {
  if (!/^\d{1,15}$/.test(id)) return res.status(400).json({ error: 'Identificador inválido' });
  next();
}

module.exports = { securityHeaders, rateLimit, emailKey, turnstile, validateIdParam };
