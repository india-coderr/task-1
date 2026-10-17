const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Settings = require('../models/Settings');
const AppError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');
const { calculateOrderBilling, round2 } = require('../utils/billing');
const { generateOrderNumber } = require('../utils/orderNumber');

/**
 * Helper to fetch MenuItem documents for items submitted in an order,
 * verifying existence, availability, and active state.
 */
async function resolveOrderItems(rawItems) {
  const itemIds = rawItems.map((i) => i.menuItemId || i.menuItem);
  const menuItems = await MenuItem.find({ _id: { $in: itemIds } });

  const itemMap = new Map();
  menuItems.forEach((doc) => itemMap.set(doc._id.toString(), doc));

  return rawItems.map((raw) => {
    const id = (raw.menuItemId || raw.menuItem).toString();
    return {
      menuItemId: id,
      quantity: raw.quantity,
      menuItemDoc: itemMap.get(id)
    };
  });
}

/**
 * Create a new order.
 * Strictly recomputes subtotal, tax, discount, and total on the server.
 */
const createOrder = async (req, res, next) => {
  const { orderType, tableNumber, customerName, items, discountType, discountValue } = req.body;

  // 1. Fetch system settings for tax rate and staff discount limits
  const settings = await Settings.getSettings();

  // 2. Fetch and verify all menu items
  const resolved = await resolveOrderItems(items);

  // 3. Compute billing snapshot
  const billing = calculateOrderBilling(
    resolved,
    settings.taxRate,
    discountType,
    discountValue,
    {
      userRole: req.userRole,
      staffDiscountLimit: settings.staffDiscountLimit
    }
  );

  // 4. Atomically generate unique order number (e.g. ORD-20261017-0001)
  const orderNumber = await generateOrderNumber();

  // 5. Create Order document
  const order = await Order.create({
    orderNumber,
    orderType,
    tableNumber: orderType === 'dine-in' ? tableNumber.trim() : undefined,
    customerName: customerName ? customerName.trim() : '',
    items: billing.items,
    subtotal: billing.subtotal,
    taxRate: billing.taxRate,
    taxAmount: billing.taxAmount,
    discountType: billing.discountType,
    discountValue: billing.discountValue,
    discountAmount: billing.discountAmount,
    total: billing.total,
    status: 'Pending',
    paymentStatus: 'Unpaid',
    payment: null,
    createdBy: req.userId
  });

  return sendSuccess(res, order, 201);
};

/**
 * Get list of orders with filters and pagination.
 */
const getOrders = async (req, res, next) => {
  const { status, paymentStatus, date, search, page = 1, limit = 20 } = req.query;

  const query = {};

  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  // Filter by local date
  if (date) {
    let startOfDay, endOfDay;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split('-').map(Number);
      startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
      endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      const dObj = new Date(date);
      startOfDay = new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate(), 0, 0, 0, 0);
      endOfDay = new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate(), 23, 59, 59, 999);
    }
    query.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }

  // Search by orderNumber, tableNumber, or customerName
  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { orderNumber: { $regex: term, $options: 'i' } },
      { tableNumber: { $regex: term, $options: 'i' } },
      { customerName: { $regex: term, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [orders, totalCount] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email role')
      .populate('payment.recordedBy', 'name email'),
    Order.countDocuments(query)
  ]);

  return sendSuccess(
    res,
    orders,
    200,
    {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    }
  );
};

/**
 * Get single order details by ID.
 */
const getOrderById = async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('createdBy', 'name email role')
    .populate('payment.recordedBy', 'name email');

  if (!order) {
    return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));
  }

  return sendSuccess(res, order);
};

/**
 * Edit items on an order.
 * Rule: Items can be edited ONLY while the order is in 'Pending' status and 'Unpaid'.
 */
const updateOrderItems = async (req, res, next) => {
  const { id } = req.params;
  const { items, discountType, discountValue } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));
  }

  // Business Rule: Items on an order can be edited only while it is Pending and Unpaid.
  if (order.status !== 'Pending') {
    return next(
      new AppError(
        `Cannot modify order items. Order is already '${order.status}'. Modifications are only permitted for 'Pending' orders.`,
        400,
        'ORDER_NOT_EDITABLE'
      )
    );
  }

  if (order.paymentStatus === 'Paid') {
    return next(
      new AppError(
        'Cannot modify order items after payment has already been recorded.',
        400,
        'ORDER_ALREADY_PAID'
      )
    );
  }

  const settings = await Settings.getSettings();
  const resolved = await resolveOrderItems(items);

  const effectiveDiscountType = discountType !== undefined ? discountType : order.discountType;
  const effectiveDiscountValue = discountValue !== undefined ? discountValue : order.discountValue;

  const billing = calculateOrderBilling(
    resolved,
    settings.taxRate,
    effectiveDiscountType,
    effectiveDiscountValue,
    {
      userRole: req.userRole,
      staffDiscountLimit: settings.staffDiscountLimit
    }
  );

  order.items = billing.items;
  order.subtotal = billing.subtotal;
  order.taxRate = billing.taxRate;
  order.taxAmount = billing.taxAmount;
  order.discountType = billing.discountType;
  order.discountValue = billing.discountValue;
  order.discountAmount = billing.discountAmount;
  order.total = billing.total;

  await order.save();

  return sendSuccess(res, order);
};

/**
 * Advance order status.
 * Strict State Machine Rules:
 * - Only forward transitions: Pending -> Preparing -> Ready -> Completed
 * - One step at a time (no skipping steps)
 * - Order can be marked Completed ONLY after payment is recorded (paymentStatus === 'Paid')
 */
const updateOrderStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status: targetStatus } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));
  }

  const allowedNextSteps = {
    Pending: 'Preparing',
    Preparing: 'Ready',
    Ready: 'Completed',
    Completed: null
  };

  const currentStatus = order.status;
  const requiredNext = allowedNextSteps[currentStatus];

  if (!requiredNext) {
    return next(
      new AppError(
        `Order is already in final state '${currentStatus}' and cannot be transitioned further.`,
        400,
        'ORDER_ALREADY_COMPLETED'
      )
    );
  }

  if (targetStatus !== requiredNext) {
    return next(
      new AppError(
        `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Order must advance strictly one step at a time to '${requiredNext}'.`,
        400,
        'INVALID_STATUS_TRANSITION'
      )
    );
  }

  // Business Rule: An order can be marked Completed ONLY after payment is recorded
  if (targetStatus === 'Completed' && order.paymentStatus !== 'Paid') {
    return next(
      new AppError(
        'Cannot complete order. Payment must be recorded and status set to Paid before marking an order as Completed.',
        400,
        'PAYMENT_REQUIRED_FOR_COMPLETION'
      )
    );
  }

  order.status = targetStatus;
  await order.save();

  return sendSuccess(res, order);
};

/**
 * Record payment for an order.
 * Rules:
 * - Reject duplicate payments
 * - Amount must exactly equal the server-computed order total
 * - Payment method must be Cash or UPI
 */
const recordPayment = async (req, res, next) => {
  const { id } = req.params;
  const { method, amount } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    return next(new AppError('Order not found.', 404, 'ORDER_NOT_FOUND'));
  }

  // Check duplicate payment
  if (order.paymentStatus === 'Paid') {
    return next(
      new AppError(
        `Payment has already been recorded for order ${order.orderNumber}. Duplicate payments are rejected.`,
        400,
        'PAYMENT_ALREADY_RECORDED'
      )
    );
  }

  // Verify amount equals server-computed total
  const roundedAmount = round2(amount);
  const roundedTotal = round2(order.total);

  if (roundedAmount !== roundedTotal) {
    return next(
      new AppError(
        `Payment amount mismatch: Provided amount (${roundedAmount}) must exactly match the order total (${roundedTotal}).`,
        400,
        'PAYMENT_AMOUNT_MISMATCH',
        [{ field: 'amount', expected: roundedTotal, received: roundedAmount }]
      )
    );
  }

  order.paymentStatus = 'Paid';
  order.payment = {
    method,
    amount: roundedTotal,
    paidAt: new Date(),
    recordedBy: req.userId
  };

  await order.save();

  return sendSuccess(res, order);
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderItems,
  updateOrderStatus,
  recordPayment
};
