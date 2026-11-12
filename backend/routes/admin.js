const express = require('express');
const router = express.Router();
router.param('id', require('../middlewares/security').validateIdParam);
const admin = require('../controllers/adminController');
const { authMiddleware, adminMiddleware, superadminMiddleware } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

// Códigos de invitación de un solo uso para registrarse como profesor.
router.post('/invites', authMiddleware, superadminMiddleware, asyncHandler(admin.createInvite));

router.get('/stats', authMiddleware, adminMiddleware, asyncHandler(admin.stats));
router.get('/users', authMiddleware, adminMiddleware, asyncHandler(admin.listUsers));
router.get('/teachers', authMiddleware, adminMiddleware, asyncHandler(admin.listTeachers));
router.get('/students', authMiddleware, adminMiddleware, asyncHandler(admin.listStudents));
router.put('/users/:id', authMiddleware, adminMiddleware, asyncHandler(admin.updateUser));
router.delete('/users/:id', authMiddleware, adminMiddleware, asyncHandler(admin.deleteUser));
router.get('/classes', authMiddleware, adminMiddleware, asyncHandler(admin.listClasses));
router.delete('/classes/:id', authMiddleware, adminMiddleware, asyncHandler(admin.deleteClass));

module.exports = router;
