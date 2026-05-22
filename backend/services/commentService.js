const commentRepository = require('../repositories/commentRepository');

async function getComment(db, commentId) {
  return await commentRepository.findCommentById(db, commentId);
}

async function deleteComment(db, commentId) {
  await commentRepository.deleteComment(db, commentId);
}

module.exports = { 
    getComment, 
    deleteComment 
};