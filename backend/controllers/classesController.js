const classService = require('../services/classService');

async function listClasses(req, res) {
  const db = req.app.locals.db;
  const rows = await classService.listClasses(db, req.user.id);
  res.json({ classes: rows });
}

async function availableClasses(req, res) {
  const db = req.app.locals.db;
  const rows = await classService.listAvailableClasses(db, req.user.id);
  res.json({ classes: rows });
}

async function createClass(req, res) {
  const db = req.app.locals.db;
  if (req.user.role !== 'teacher' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Solo profesores pueden crear clases' });
  }
  const { title, description } = req.body;
  const classRow = await classService.createClass(db, req.user.id, title, description);
  res.json({ class: classRow });
}

async function getClass(req, res) {
  const db = req.app.locals.db;
  const classId = Number(req.params.id);
  const classRow = await classService.getClass(db, classId);
  if (!classRow) {
    const err = new Error('CLASS_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }
  const comments = await classService.getClassComments(db, classId);
  res.json({ class: classRow, comments });
}

async function deleteClass(req, res) {
  const db = req.app.locals.db;
  const classId = Number(req.params.id);
  const classRow = await classService.getClass(db, classId);
  if (!classRow) {
    const err = new Error('CLASS_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }
  if (classRow.ownerId !== req.user.id && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  await classService.deleteClass(db, classId);
  res.json({ ok: true });
}

async function joinClass(req, res) {
  const db = req.app.locals.db;
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código de clase obligatorio' });
  const result = await classService.joinClass(db, code, req.user.id);
  res.json(result);
}

async function leaveClass(req, res) {
  const db = req.app.locals.db;
  const { classId } = req.body;
  await classService.leaveClass(db, classId, req.user.id);
  res.json({ ok: true });
}

async function getDesigns(req, res) {
  const db = req.app.locals.db;
  const classId = Number(req.params.id);
  const classRow = await classService.getClass(db, classId);
  if (!classRow) {
    const err = new Error('CLASS_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }
  const memberRows = await classService.isUserInClass(db, classId, req.user.id);
  if (!memberRows && classRow.ownerId !== req.user.id && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  const designs = await classService.listDesignsByClass(db, classId);
  const comments = await classService.getClassComments(db, classId);
  res.json({ designs, comments });
}

async function postComment(req, res) {
  const db = req.app.locals.db;
  const classId = Number(req.params.id);
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'El contenido es obligatorio' });
  const comment = await classService.addClassComment(db, classId, req.user.id, content);
  res.json({ comment });
}

module.exports = {
  listClasses,
  availableClasses,
  createClass,
  getClass,
  deleteClass,
  joinClass,
  leaveClass,
  getDesigns,
  postComment
};