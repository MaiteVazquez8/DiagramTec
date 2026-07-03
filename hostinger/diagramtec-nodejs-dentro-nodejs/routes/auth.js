const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const requireDb = require('../middlewares/requireDb');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/google', authController.googleRedirect);
router.get('/google/callback', requireDb, asyncHandler(authController.googleCallback));

router.post('/register', requireDb, asyncHandler(authController.register));
router.post('/login', requireDb, asyncHandler(authController.login));
router.post('/recovery-code', requireDb, asyncHandler(authController.requestRecoveryCode));
router.post('/reset-password', requireDb, asyncHandler(authController.resetPassword));
router.get('/me', authMiddleware, requireDb, asyncHandler(authController.me));
router.put('/me', authMiddleware, requireDb, asyncHandler(authController.updateProfile));
router.delete('/me', authMiddleware, requireDb, asyncHandler(authController.deleteAccount));

module.exports = router;
