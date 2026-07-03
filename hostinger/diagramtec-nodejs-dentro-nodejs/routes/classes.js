const express = require('express');
const router = express.Router();
const classes = require('../controllers/classesController');
const { authMiddleware } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/', authMiddleware, asyncHandler(classes.listClasses));
router.get('/available', authMiddleware, asyncHandler(classes.availableClasses));
router.post('/', authMiddleware, asyncHandler(classes.createClass));
router.get('/:id', authMiddleware, asyncHandler(classes.getClass));
router.delete('/:id', authMiddleware, asyncHandler(classes.deleteClass));
router.post('/join', authMiddleware, asyncHandler(classes.joinClass));
router.post('/leave', authMiddleware, asyncHandler(classes.leaveClass));
router.get('/:id/members', authMiddleware, asyncHandler(classes.getMembers));
router.get('/:id/designs', authMiddleware, asyncHandler(classes.getDesigns));
router.post('/:id/comments', authMiddleware, asyncHandler(classes.postComment));
router.post('/:id/expel', authMiddleware, asyncHandler(classes.expelStudent));

module.exports = router;