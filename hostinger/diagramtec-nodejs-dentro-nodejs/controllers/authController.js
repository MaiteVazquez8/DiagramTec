const authService = require('../services/authService');
const googleAuthService = require('../services/googleAuthService');

async function register(req, res) {
  const db = req.app.locals.db;
  const { firstName, lastName, email, password, role } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  const result = await authService.register(db, { firstName, lastName, email, password, role });
  res.json(result);
}

async function login(req, res) {
  const db = req.app.locals.db;
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  const result = await authService.login(db, email, password);
  res.json(result);
}

async function me(req, res) {
  const db = req.app.locals.db;
  const user = await authService.getMe(db, req.user.id);
  if (!user) {
    const err = new Error('USER_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }
  res.json({ user });
}

async function updateProfile(req, res) {
  const db = req.app.locals.db;
  const { firstName, lastName, email } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }
  const user = await authService.updateProfile(db, req.user.id, { firstName, lastName, email });
  res.json({ user });
}

async function deleteAccount(req, res) {
  const db = req.app.locals.db;
  const deleted = await authService.deleteAccount(db, req.user.id);
  if (!deleted) {
    const err = new Error('USER_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }
  res.status(204).send();
}

async function requestRecoveryCode(req, res) {
  const db = req.app.locals.db;
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Ingresa un correo válido.' });
  }
  const result = await authService.requestRecoveryCode(db, email);
  res.json(result);
}

async function resetPassword(req, res) {
  const db = req.app.locals.db;
  const { email, token, password, password2 } = req.body;
  if (!email || !token || !password || !password2) {
    return res.status(400).json({ error: 'Complete todos los campos' });
  }
  const result = await authService.resetPassword(db, email, token, password, password2);
  res.json(result);
}

function googleRedirect(req, res) {
  try {
    const state = googleAuthService.createOAuthState();
    res.redirect(googleAuthService.buildGoogleAuthUrl(state));
  } catch (err) {
    if (err.message === 'GOOGLE_NOT_CONFIGURED') {
      return res.status(500).json({ error: 'Google OAuth no configurado en el servidor' });
    }
    console.error('Google redirect error:', err);
    return res.status(500).json({ error: 'No se pudo iniciar sesión con Google' });
  }
}

async function googleCallback(req, res) {
  const db = req.app.locals.db;
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ error: 'Faltan parámetros de Google' });
  }
  if (!googleAuthService.consumeOAuthState(String(state))) {
    return res.status(403).json({ error: 'Estado OAuth inválido' });
  }

  try {
    const profile = await googleAuthService.exchangeCodeForUser(String(code));
    const user = await authService.loginOrRegisterWithGoogle(db, profile);
    const token = googleAuthService.signUserToken(user);
    res.redirect(googleAuthService.buildFrontendRedirect(token));
  } catch (err) {
    console.error('Google callback error:', err.message);
    const frontendUrl = (process.env.FRONTEND_URL || 'https://diagramtec.com').replace(/\/$/, '');
    res.redirect(`${frontendUrl}/login?error=google`);
  }
}

module.exports = {
  register,
  login,
  me,
  updateProfile,
  deleteAccount,
  requestRecoveryCode,
  resetPassword,
  googleRedirect,
  googleCallback,
};
