async function findCommentById(db, commentId) {
  const [rows] = await db.execute('SELECT * FROM comments WHERE id = ?', [commentId]);
  return rows[0] || null;
}

async function deleteComment(db, commentId) {
  await db.execute('DELETE FROM comments WHERE id = ?', [commentId]);
}

module.exports = { findCommentById, deleteComment };