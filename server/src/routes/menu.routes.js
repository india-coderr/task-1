const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const { validate } = require('../middlewares/validate');
const asyncHandler = require('../middlewares/asyncHandler');
const { createMenuSchema, updateMenuSchema, idParamSchema } = require('../validations/menu.validation');

// All menu endpoints require authentication
router.use(authenticate);

// GET /api/menu (Supports ?search= and ?category=)
router.get('/', asyncHandler(menuController.getMenu));

// Admin only operations
router.post('/', requireRole('admin'), validate(createMenuSchema), asyncHandler(menuController.createMenuItem));
router.put('/:id', requireRole('admin'), validate(updateMenuSchema), asyncHandler(menuController.updateMenuItem));
router.patch('/:id/deactivate', requireRole('admin'), validate(idParamSchema), asyncHandler(menuController.deactivateMenuItem));

module.exports = router;
