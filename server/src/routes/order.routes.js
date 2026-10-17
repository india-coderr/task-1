const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const asyncHandler = require('../middlewares/asyncHandler');
const {
  createOrderSchema,
  updateOrderItemsSchema,
  updateStatusSchema,
  recordPaymentSchema,
  queryOrdersSchema
} = require('../validations/order.validation');

router.use(authenticate);

// POST /api/orders - Create new order
router.post('/', validate(createOrderSchema), asyncHandler(orderController.createOrder));

// GET /api/orders - List orders with filters & pagination
router.get('/', validate(queryOrdersSchema), asyncHandler(orderController.getOrders));

// GET /api/orders/:id - Get single order details
router.get('/:id', asyncHandler(orderController.getOrderById));

// PUT /api/orders/:id - Edit items while Pending
router.put('/:id', validate(updateOrderItemsSchema), asyncHandler(orderController.updateOrderItems));

// PATCH /api/orders/:id/status - Advance status
router.patch('/:id/status', validate(updateStatusSchema), asyncHandler(orderController.updateOrderStatus));

// POST /api/orders/:id/payment - Record payment (Cash/UPI)
router.post('/:id/payment', validate(recordPaymentSchema), asyncHandler(orderController.recordPayment));

module.exports = router;
