const authService = require('../services/authService');
const recoveryService = require('../services/recoveryService');
const googleAuthService = require('../services/googleAuthService');
const sessionService = require('../services/sessionService');
const { isValidEmail } = require('../utils/validators');

/**
 * Ramas JSON de los scripts PHP (las mismas respuestas y códigos HTTP)
 * más google_auth.php. Los formularios HTML están en phpPagesController.
 */

function str(value) {
  return typeof value === 'string' ? value : '';
}

async function loginJson(req, res) {
  const db = req.app.locals.db;
  const body = req.body || {};

  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);

  if (email === '' || password === '') {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const result = await authService.login(db, email, password);
    return res.json(result);
  } catch (err) {
    if (err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    throw err;
  }
}

async function registerJson(req, res) {
  const db = req.app.locals.db;
  const body = req.body || {};

  const firstName = str(body.firstName).trim();
  const lastName = str(body.lastName).trim();
  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);
  const role = ['student', 'teacher'].includes(body.role) ? body.role : 'student';

  if (firstName === '' || lastName === '' || email === '' || password === '') {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const result = await authService.register(db, { firstName, lastName, email, password, role });
    return res.json(result);
  } catch (err) {
    if (err.message === 'EMAIL_EXISTS') {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    console.error('[REGISTER]', err.message || err);
    return res.status(500).json({ error: 'Error al crear usuario' });
  }
}

async function requestRecoveryCode(req, res) {
  const db = req.app.locals.db;
  const body = req.body || {};

  const email = str(body.email).trim().toLowerCase();
  if (email === '' || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Ingresa un correo válido.' });
  }

  const outcome = await recoveryService.requestRecoveryCode(db, email);
  if (outcome.error) {
    return res.status(outcome.status).json({ error: outcome.error });
  }
  return res.status(outcome.status).json({ message: outcome.message });
}

async function resetPasswordJson(req, res) {
  const db = req.app.locals.db;
  const body = req.body || {};

  const email = str(body.email).trim().toLowerCase();
  const token = str(body.token).trim();
  const password = str(body.password);
  const password2 = str(body.password2);

  if (email === '' || token === '' || password === '' || password2 === '') {
    return res.status(400).json({ error: 'Complete todos los campos' });
  }

  if (password !== password2) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden' });
  }

  const outcome = await recoveryService.resetPasswordWithCode(db, email, token, password);
  if (!outcome.ok) {
    return res.status(outcome.status).json({ error: outcome.error });
  }
  return res.status(outcome.status).json({ message: outcome.message });
}

async function googleAuth(req, res) {
  // En PHP google_auth.php siempre ejecuta session_start().
  sessionService.start(req, res);

  const action = str(req.query.action);
  if (action === 'login') {
    return googleAuthService.handleLogin(req, res);
  }
  if (action === 'callback') {
    return googleAuthService.handleCallback(req, res);
  }
  return res.status(400).json({ error: 'Action not specified' });
}

module.exports = {
  loginJson,
  registerJson,
  requestRecoveryCode,
  resetPassword: resetPasswordJson,
  googleAuth,
};
