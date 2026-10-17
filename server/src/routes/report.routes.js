const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');

router.use(authenticate);

// GET /api/reports/daily-sales?date=YYYY-MM-DD
router.get('/daily-sales', asyncHandler(reportController.getDailySalesReport));

module.exports = router;
