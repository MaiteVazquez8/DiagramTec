const authService = require('../services/authService');

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

module.exports = { 
    register, 
    login, 
    me, 
    updateProfile,
    deleteAccount 
};
