const authService = require('../services/authService');
const googleAuthService = require('../services/googleAuthService');
const { setSessionCookie, clearSessionCookie, readCookie } = require('../middlewares/auth');

const PASSWORD_REQUIREMENTS_MESSAGE = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial';
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const STATE_COOKIE = 'g_oauth_state';

function isText(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function profileError({ firstName, lastName, email }) {
  if (!isText(firstName, 100) || !isText(lastName, 100) || !isText(email, 254)) return 'Faltan datos obligatorios';
  if (!EMAIL_RE.test(email.trim())) return 'Ingresá un correo válido';
  return null;
}

async function register(req, res) {
  const db = req.app.locals.db;
  const { firstName, lastName, email, password, role, inviteCode } = req.body;
  const error = profileError({ firstName, lastName, email });
  if (error) return res.status(400).json({ error });
  if (!authService.isStrongPassword(password)) {
    return res.status(400).json({ error: PASSWORD_REQUIREMENTS_MESSAGE });
  }
  const user = await authService.register(db, {
    firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password, role, inviteCode,
  });
  setSessionCookie(res, user);
  res.json({ user, message: 'Cuenta creada. Te enviamos un enlace para verificar tu email.' });
}

async function login(req, res) {
  const db = req.app.locals.db;
  const { email, password } = req.body;
  if (!isText(email, 254) || !isText(password, 200)) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  const user = await authService.login(db, email.trim(), password);
  setSessionCookie(res, user);
  res.json({ user });
}

function logout(req, res) {
  clearSessionCookie(res);
  res.status(204).send();
}

async function me(req, res) {
  const db = req.app.locals.db;
  const user = await authService.getMe(db, req.user.id);
  if (!user) throw new Error('USER_NOT_FOUND');
  res.json({ user });
}

async function updateProfile(req, res) {
  const db = req.app.locals.db;
  const { firstName, lastName, email, currentPassword, newPassword } = req.body;
  const error = profileError({ firstName, lastName, email });
  if (error) return res.status(400).json({ error });
  const result = await authService.updateProfile(db, req.user.id, {
    firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), currentPassword, newPassword,
  });
  // Cambiar la contraseña invalida los tokens viejos: esta sesión recibe uno nuevo.
  if (result.passwordChanged) setSessionCookie(res, result.user);
  res.json({ user: result.user, message: result.message });
}

async function deleteAccount(req, res) {
  const db = req.app.locals.db;
  const deleted = await authService.deleteAccount(db, req.user.id, req.body?.password);
  if (!deleted) throw new Error('USER_NOT_FOUND');
  clearSessionCookie(res);
  res.status(204).send();
}

async function verifyEmail(req, res) {
  const db = req.app.locals.db;
  let result = 'invalid';
  try {
    result = (await authService.verifyEmail(db, req.query.token)) ? 'ok' : 'invalid';
  } catch (err) {
    result = err.message === 'EMAIL_EXISTS' ? 'taken' : 'invalid';
  }
  res.redirect(googleAuthService.buildFrontendRedirect({ verified: result }));
}

async function resendVerification(req, res) {
  const db = req.app.locals.db;
  res.json(await authService.resendVerification(db, req.user.id));
}

async function requestRecoveryCode(req, res) {
  const db = req.app.locals.db;
  const { email } = req.body;
  if (!isText(email, 254) || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: 'Ingresá un correo válido.' });
  }
  await authService.requestRecoveryCode(db, email.trim());
  // Misma respuesta exista o no la cuenta: no revela qué correos están registrados.
  res.json({ message: 'Si el correo está registrado, te enviamos un código. Revisá tu bandeja.' });
}

async function resetPassword(req, res) {
  const db = req.app.locals.db;
  const { email, token, password, password2 } = req.body;
  if (!isText(email, 254) || !isText(token, 12) || !isText(password, 200) || typeof password2 !== 'string') {
    return res.status(400).json({ error: 'Complete todos los campos' });
  }
  if (password !== password2) throw new Error('PASSWORD_MISMATCH');
  if (!authService.isStrongPassword(password)) {
    return res.status(400).json({ error: PASSWORD_REQUIREMENTS_MESSAGE });
  }
  const result = await authService.resetPassword(db, email.trim(), token.trim(), password);
  res.json(result);
}

const stateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  // "/" y no "/auth/google": detrás de un proxy con prefijo (Vite usa /api) la ruta cambia.
  path: '/',
};

function googleRedirect(req, res) {
  try {
    const state = googleAuthService.createOAuthState();
    // El state queda atado a este navegador: evita que alguien inicie sesión
    // a la víctima en una cuenta ajena (login CSRF).
    res.cookie(STATE_COOKIE, state, { ...stateCookieOptions, maxAge: 15 * 60 * 1000 });
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
  const cookieState = readCookie(req, STATE_COOKIE);
  res.clearCookie(STATE_COOKIE, stateCookieOptions);

  if (typeof code !== 'string' || typeof state !== 'string') {
    return res.redirect(googleAuthService.buildFrontendRedirect({ error: 'google_params' }));
  }
  if (state !== cookieState || !googleAuthService.consumeOAuthState(state)) {
    console.warn('[google] Estado OAuth inválido o expirado');
    return res.redirect(googleAuthService.buildFrontendRedirect({ error: 'oauth_state' }));
  }

  try {
    const profile = await googleAuthService.exchangeCodeForUser(code);
    const user = await authService.loginOrRegisterWithGoogle(db, profile);
    // La sesión queda en la cookie HttpOnly; la URL no lleva ningún token.
    setSessionCookie(res, user);
    res.redirect(googleAuthService.buildFrontendRedirect({ google: 'ok' }));
  } catch (err) {
    console.error('Google callback error:', err.message);
    res.redirect(googleAuthService.buildFrontendRedirect({ error: 'google' }));
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  updateProfile,
  deleteAccount,
  verifyEmail,
  resendVerification,
  requestRecoveryCode,
  resetPassword,
  googleRedirect,
  googleCallback,
};
