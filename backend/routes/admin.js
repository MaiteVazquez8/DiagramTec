const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/stats', authMiddleware, adminMiddleware, asyncHandler(admin.stats));
router.get('/users', authMiddleware, adminMiddleware, asyncHandler(admin.listUsers));
router.put('/users/:id', authMiddleware, adminMiddleware, asyncHandler(admin.updateUser));
router.delete('/users/:id', authMiddleware, adminMiddleware, asyncHandler(admin.deleteUser));
router.get('/classes', authMiddleware, adminMiddleware, asyncHandler(admin.listClasses));
router.delete('/classes/:id', authMiddleware, adminMiddleware, asyncHandler(admin.deleteClass));

module.exports = router;