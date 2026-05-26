const adminService = require('../services/adminService');

async function stats(req, res) {
  const db = req.app.locals.db;
  const stats = await adminService.getStats(db);
  res.json(stats);
}

async function listUsers(req, res) {
  const db = req.app.locals.db;
  const users = await adminService.listUsers(db);
  res.json({ users });
}

async function updateUser(req, res) {
  const db = req.app.locals.db;
  const id = Number(req.params.id);
  const user = await adminService.updateUser(db, id, req.body);
  res.json({ user });
}

async function deleteUser(req, res) {
  const db = req.app.locals.db;
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  await adminService.deleteUser(db, id);
  res.json({ ok: true });
}

async function listClasses(req, res) {
  const db = req.app.locals.db;
  const classes = await adminService.listClasses(db);
  res.json({ classes });
}

async function deleteClass(req, res) {
  const db = req.app.locals.db;
  const id = Number(req.params.id);
  await adminService.deleteClass(db, id);
  res.json({ ok: true });
}

module.exports = { 
    stats, 
    listUsers, 
    updateUser, 
    deleteUser, 
    listClasses, 
    deleteClass 
};