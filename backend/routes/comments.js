const express = require('express');
const router = express.Router();
router.param('id', require('../middlewares/security').validateIdParam);
const comments = require('../controllers/commentsController');
const { authMiddleware } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

router.delete('/:id', authMiddleware, asyncHandler(comments.deleteComment));

module.exports = router;