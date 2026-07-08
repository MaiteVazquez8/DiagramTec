const commentService = require('../services/commentService');
const classRepository = require('../repositories/classRepository');

function sameId(a, b) {
  return Number(a) === Number(b);
}

async function deleteComment(req, res) {
  const db = req.app.locals.db;
  const commentId = Number(req.params.id);
  const comment = await commentService.getComment(db, commentId);
  if (!comment) {
    const err = new Error('COMMENT_NOT_FOUND');
    err.statusCode = 404;
    throw err;
  }

  const isAuthor = sameId(comment.userId, req.user.id);
  const isSuperadmin = req.user.role === 'superadmin';

  let canDeleteAsTeacher = false;
  if (req.user.role === 'teacher' && comment.classId) {
    const classRow = await classRepository.findClassById(db, comment.classId);
    if (classRow && sameId(classRow.ownerId, req.user.id)) {
      const author = await classRepository.findUserRole(db, comment.userId);
      canDeleteAsTeacher = author?.role === 'student';
    }
  }

  if (!isAuthor && !isSuperadmin && !canDeleteAsTeacher) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  await commentService.deleteComment(db, commentId);
  res.json({ ok: true });
}

module.exports = {
  deleteComment,
};
