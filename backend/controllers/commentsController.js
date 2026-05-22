const commentService = require('../services/commentService');

async function deleteComment(req, res) {
  const db = req.app.locals.db;
  const commentId = Number(req.params.id);
  const comment = await commentService.getComment(db, commentId);
  if (!comment) {
    const err = new Error('COMMENT_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }
  if (comment.userId !== req.user.id && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  await commentService.deleteComment(db, commentId);
  res.json({ ok: true });
}

module.exports = { 
    deleteComment 
};
