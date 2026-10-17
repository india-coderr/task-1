const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const { validate } = require('../middlewares/validate');
const asyncHandler = require('../middlewares/asyncHandler');
const { updateSettingsSchema } = require('../validations/settings.validation');

router.use(authenticate);

// GET /api/settings - View POS settings
router.get('/', asyncHandler(settingsController.getSettings));

// PUT /api/settings - Update POS settings (Admin only)
router.put('/', requireRole('admin'), validate(updateSettingsSchema), asyncHandler(settingsController.updateSettings));

module.exports = router;
