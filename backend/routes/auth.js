const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const waitForDb = require('../middlewares/waitForDb');
const asyncHandler = require('../middlewares/asyncHandler');
const { rateLimit, emailKey, turnstile } = require('../middlewares/security');

const MIN = 60 * 1000;
const db = waitForDb();
// Límite por IP alto (aulas detrás de una misma IP) y por IP+email más bajo.
const loginLimit = [
  rateLimit({ windowMs: 15 * MIN, max: 100 }),
  rateLimit({ windowMs: 15 * MIN, max: 8, key: emailKey }),
];
const registerLimit = rateLimit({ windowMs: 60 * MIN, max: 40 });
const recoveryLimit = [
  rateLimit({ windowMs: 15 * MIN, max: 20 }),
  rateLimit({ windowMs: 15 * MIN, max: 3, key: emailKey }),
];
const resetLimit = rateLimit({ windowMs: 15 * MIN, max: 20 });
const googleLimit = rateLimit({ windowMs: 15 * MIN, max: 60 });

router.get('/google', googleLimit, authController.googleRedirect);
router.get('/google/callback', googleLimit, waitForDb({ redirectOnTimeout: true }), asyncHandler(authController.googleCallback));

router.post('/register', registerLimit, turnstile('signup'), db, asyncHandler(authController.register));
router.post('/login', loginLimit, turnstile('login'), db, asyncHandler(authController.login));
router.post('/recovery-code', recoveryLimit, turnstile('recovery'), db, asyncHandler(authController.requestRecoveryCode));
router.post('/reset-password', resetLimit, db, asyncHandler(authController.resetPassword));
router.get('/me', db, authMiddleware, asyncHandler(authController.me));
router.put('/me', db, authMiddleware, asyncHandler(authController.updateProfile));
router.delete('/me', db, authMiddleware, asyncHandler(authController.deleteAccount));

module.exports = router;
