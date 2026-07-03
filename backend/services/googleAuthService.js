const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL
    || `${(process.env.API_PUBLIC_URL || process.env.VITE_API_URL || '').replace(/\/$/, '')}/auth/google/callback`;
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('GOOGLE_NOT_CONFIGURED');
  }

  return { clientId, clientSecret, redirectUri, frontendUrl };
}

/** State firmado con JWT — funciona con varias instancias Node en Hostinger. */
function createOAuthState() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('GOOGLE_NOT_CONFIGURED');

  return jwt.sign(
    { oauth: 'google', rnd: crypto.randomBytes(12).toString('hex') },
    secret,
    { expiresIn: '15m' },
  );
}

function consumeOAuthState(state) {
  if (!state || !process.env.JWT_SECRET) return false;

  try {
    const payload = jwt.verify(String(state), process.env.JWT_SECRET);
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

  const tokenRes = await axios.post(
    'https://oauth2.googleapis.com/token',
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  const accessToken = tokenRes.data?.access_token;
  if (!accessToken) throw new Error('GOOGLE_NO_TOKEN');

  const userRes = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const googleId = userRes.data?.id;
  const email = String(userRes.data?.email || '').toLowerCase();
  const firstName = userRes.data?.given_name || 'Google';
  const lastName = userRes.data?.family_name || 'User';

  if (!googleId || !email) throw new Error('GOOGLE_INCOMPLETE_PROFILE');

  return { googleId, email, firstName, lastName };
}

function signUserToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '48h' },
  );
}

function buildFrontendRedirect(token) {
  const { frontendUrl } = getGoogleConfig();
  return `${frontendUrl}/login?token=${encodeURIComponent(token)}`;
}

function buildFrontendErrorRedirect(errorCode) {
  const { frontendUrl } = getGoogleConfig();
  return `${frontendUrl}/login?error=${encodeURIComponent(errorCode)}`;
}

module.exports = {
  createOAuthState,
  consumeOAuthState,
  buildGoogleAuthUrl,
  exchangeCodeForUser,
  signUserToken,
  buildFrontendRedirect,
  buildFrontendErrorRedirect,
  getGoogleConfig,
};
