const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const waitForDb = require('../middlewares/waitForDb');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/google', authController.googleRedirect);
router.get('/google/callback', waitForDb({ redirectOnTimeout: true }), asyncHandler(authController.googleCallback));

router.post('/register', waitForDb(), asyncHandler(authController.register));
router.post('/login', waitForDb(), asyncHandler(authController.login));
router.post('/recovery-code', waitForDb(), asyncHandler(authController.requestRecoveryCode));
router.post('/reset-password', waitForDb(), asyncHandler(authController.resetPassword));
router.get('/me', authMiddleware, waitForDb(), asyncHandler(authController.me));
router.put('/me', authMiddleware, waitForDb(), asyncHandler(authController.updateProfile));
router.delete('/me', authMiddleware, waitForDb(), asyncHandler(authController.deleteAccount));

module.exports = router;
