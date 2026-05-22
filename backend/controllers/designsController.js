const designService = require('../services/designService');

async function listDesigns(req, res) {
  const db = req.app.locals.db;
  const designs = await designService.listDesigns(db, req.user.id);
  res.json({ designs });
}

async function getDesign(req, res) {
  const db = req.app.locals.db;
  const id = Number(req.params.id);
  const design = await designService.getDesign(db, id, req.user);
  res.json({ design });
}

async function createDesign(req, res) {
  const db = req.app.locals.db;
  const design = await designService.createDesign(db, req.user.id, req.body);
  res.json({ design });
}

async function updateDesign(req, res) {
  const db = req.app.locals.db;
  const id = Number(req.params.id);
  const design = await designService.updateDesign(db, id, req.user.id, req.user.role, req.body);
  res.json({ design });
}

async function deleteDesign(req, res) {
  const db = req.app.locals.db;
  const id = Number(req.params.id);
  await designService.deleteDesign(db, id, req.user.id, req.user.role);
  res.json({ ok: true });
}

async function copyDesign(req, res) {
  const db = req.app.locals.db;
  const id = Number(req.params.id);
  const design = await designService.copyDesign(db, id, req.user.id);
  if (!design) {
    const err = new Error('DESIGN_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }
  res.json({ design });
}

module.exports = { 
    listDesigns, 
    getDesign, 
    createDesign, 
    updateDesign, 
    deleteDesign, 
    copyDesign 
};
