const express = require('express');
const router = express.Router();
router.param('id', require('../middlewares/security').validateIdParam);
const classes = require('../controllers/classesController');
const { authMiddleware, requireVerifiedEmail } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');
const { rateLimit } = require('../middlewares/security');

router.get('/', authMiddleware, asyncHandler(classes.listClasses));
router.get('/available', authMiddleware, asyncHandler(classes.availableClasses));
router.post('/', authMiddleware, requireVerifiedEmail, asyncHandler(classes.createClass));
router.get('/:id', authMiddleware, asyncHandler(classes.getClass));
router.patch('/:id', authMiddleware, asyncHandler(classes.updateClass));
router.delete('/:id', authMiddleware, asyncHandler(classes.deleteClass));
// Frena probar códigos de clase por fuerza bruta.
router.post('/join', authMiddleware, requireVerifiedEmail, rateLimit({ windowMs: 15 * 60 * 1000, max: 20, key: (req) => `u${req.user.id}` }), asyncHandler(classes.joinClass));
router.post('/leave', authMiddleware, asyncHandler(classes.leaveClass));
router.get('/:id/members', authMiddleware, asyncHandler(classes.getMembers));
router.get('/:id/designs', authMiddleware, asyncHandler(classes.getDesigns));
router.post('/:id/comments', authMiddleware, requireVerifiedEmail, asyncHandler(classes.postComment));
router.post('/:id/expel', authMiddleware, asyncHandler(classes.expelStudent));

module.exports = router;