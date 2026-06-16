const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.me));
router.put('/me', authMiddleware, asyncHandler(authController.updateProfile));
router.delete('/me', authMiddleware, asyncHandler(authController.deleteAccount));

module.exports = router;
