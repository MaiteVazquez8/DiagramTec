const express = require('express');
const router = express.Router();
const designs = require('../controllers/designsController');
const { authMiddleware } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/', authMiddleware, asyncHandler(designs.listDesigns));
router.get('/:id', authMiddleware, asyncHandler(designs.getDesign));
router.post('/', authMiddleware, asyncHandler(designs.createDesign));
router.put('/:id', authMiddleware, asyncHandler(designs.updateDesign));
router.delete('/:id', authMiddleware, asyncHandler(designs.deleteDesign));
router.post('/:id/copy', authMiddleware, asyncHandler(designs.copyDesign));

module.exports = router;