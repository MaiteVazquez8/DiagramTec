const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL
    || `${(process.env.API_PUBLIC_URL || '').replace(/\/$/, '')}/auth/google/callback`;

  if (!clientId || !clientSecret || !redirectUri.startsWith('http')) {
    throw new Error('GOOGLE_NOT_CONFIGURED');
  }

  return { clientId, clientSecret, redirectUri };
}

/** State firmado con JWT (sirve con varias instancias) y además guardado en cookie. */
function createOAuthState() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('GOOGLE_NOT_CONFIGURED');

  return jwt.sign(
    { oauth: 'google', rnd: crypto.randomBytes(12).toString('hex') },
    secret,
    { algorithm: 'HS256', expiresIn: '15m' },
  );
}

function consumeOAuthState(state) {
  if (!state || !process.env.JWT_SECRET) return false;

  try {
    const payload = jwt.verify(String(state), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    return payload?.oauth === 'google';
  } catch {
    return false;
  }
}

function buildGoogleAuthUrl(state) {
  const { clientId, redirectUri } = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForUser(code) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(10_000),
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  const tokenData = tokenRes.ok ? await tokenRes.json() : null;
  const accessToken = tokenData?.access_token;
  if (!accessToken) throw new Error('GOOGLE_NO_TOKEN');

  const userRes = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  const info = userRes.ok ? await userRes.json() : {};

  const googleId = info.id;
  const email = String(info.email || '').toLowerCase();
  const firstName = String(info.given_name || 'Google').slice(0, 100);
  const lastName = String(info.family_name || 'User').slice(0, 100);

  if (!googleId || !email) throw new Error('GOOGLE_INCOMPLETE_PROFILE');
  // Sin email verificado alguien podría vincularse a la cuenta de otro.
  if (info.verified_email !== true) throw new Error('GOOGLE_EMAIL_NOT_VERIFIED');

  return { googleId, email, firstName, lastName };
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
}

// Vuelve al login del frontend con un aviso (la sesión, si la hay, ya va en la cookie).
function buildFrontendRedirect(params) {
  return `${frontendUrl()}/login?${new URLSearchParams(params)}`;
}

module.exports = {
  createOAuthState,
  consumeOAuthState,
  buildGoogleAuthUrl,
  exchangeCodeForUser,
  buildFrontendRedirect,
};
