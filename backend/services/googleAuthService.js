const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  findUserByEmailOrGoogleId,
  setGoogleId,
  createUserWithGoogle,
} = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Equivalente a php/google_auth.php (?action=login y ?action=callback).
 * Variables de entorno: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
 * GOOGLE_CALLBACK_URL y FRONTEND_URL.
 */

async function handleLogin(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Google credentials not configured' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  req.session.google_oauth_state = state;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    access_type: 'online',
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

async function handleCallback(req, res) {
  const db = req.app.locals.db;

  const code = req.query.code ?? null;
  const state = req.query.state ?? null;

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state' });
  }

  if (!req.session.google_oauth_state || req.session.google_oauth_state !== state) {
    return res.status(403).json({ error: 'Invalid state parameter' });
  }

  delete req.session.google_oauth_state;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;

  // Intercambiar código por token
  let tokenResponse;
  try {
    tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
  } catch (err) {
    return res.status(401).json({ error: 'Failed to exchange code for token' });
  }

  if (!tokenResponse || tokenResponse.status !== 200) {
    return res.status(401).json({ error: 'Failed to exchange code for token' });
  }

  const accessToken = tokenResponse.data && tokenResponse.data.access_token;
  if (!accessToken) {
    return res.status(401).json({ error: 'No access token received' });
  }

  // Obtener información del usuario
  let userInfoResponse;
  try {
    userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    return res.status(401).json({ error: 'Failed to fetch user info' });
  }

  if (!userInfoResponse || userInfoResponse.status !== 200) {
    return res.status(401).json({ error: 'Failed to fetch user info' });
  }

  const userInfo = userInfoResponse.data || {};
  const googleId = userInfo.id ?? null;
  const email = String(userInfo.email ?? '').toLowerCase();
  const firstName = userInfo.given_name ?? 'Google';
  const lastName = userInfo.family_name ?? 'User';

  if (!googleId || !email) {
    return res.status(400).json({ error: 'Incomplete user info from Google' });
  }

  const existingUser = await findUserByEmailOrGoogleId(db, email, googleId);

  let user;
  if (existingUser) {
    // En PHP el SELECT no incluía googleId, por lo que siempre se actualizaba.
    await setGoogleId(db, existingUser.id, googleId);
    user = existingUser;
  } else {
    try {
      const id = await createUserWithGoogle(db, firstName, lastName, email, googleId, 'student');
      user = { id, firstName, lastName, email, role: 'student' };
    } catch (err) {
      console.error('[GOOGLE_AUTH]', err.message || err);
      return res.status(500).json({ error: 'Error creating user' });
    }
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '48h' });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return res.redirect(`${frontendUrl.replace(/\/+$/, '')}/login?token=${encodeURIComponent(token)}`);
}

module.exports = { handleLogin, handleCallback };
