const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { sendSuccess } = require('../utils/response');
const { round2 } = require('../utils/billing');

/**
 * Generate daily sales summary report for a given date (defaults to server's local today).
 * Computes:
 * - Total orders today
 * - Completed orders
 * - In-progress orders (Pending, Preparing, Ready)
 * - Daily gross sales (sum of totals of paid orders)
 * - Sales split by payment method (Cash vs UPI)
 * - Recent 10 orders
 */
const getDailySalesReport = async (req, res, next) => {
  const { date } = req.query;

  let startOfDay, endOfDay;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number);
    startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
    endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
  } else {
    const now = new Date();
    startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }

  const dayFilter = {
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  };

  const [ordersToday, settings] = await Promise.all([
    Order.find(dayFilter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role')
      .populate('payment.recordedBy', 'name email'),
    Settings.getSettings()
  ]);

  let totalOrders = ordersToday.length;
  let completedOrders = 0;
  let pendingOrders = 0;
  let preparingOrders = 0;
  let readyOrders = 0;
  let totalDailySales = 0;
  let cashSales = 0;
  let upiSales = 0;
  let cashCount = 0;
  let upiCount = 0;

  for (const order of ordersToday) {
    if (order.status === 'Completed') {
      completedOrders += 1;
    } else if (order.status === 'Preparing') {
      preparingOrders += 1;
    } else if (order.status === 'Ready') {
      readyOrders += 1;
    } else {
      pendingOrders += 1;
    }

    if (order.paymentStatus === 'Paid') {
      totalDailySales = round2(totalDailySales + order.total);

      if (order.payment && order.payment.method === 'Cash') {
        cashSales = round2(cashSales + order.payment.amount);
        cashCount += 1;
      } else if (order.payment && order.payment.method === 'UPI') {
        upiSales = round2(upiSales + order.payment.amount);
        upiCount += 1;
      }
    }
  }

  const inProgressOrders = pendingOrders + preparingOrders + readyOrders;
  const recentOrders = ordersToday.slice(0, 10);

  const formattedDate = `${startOfDay.getFullYear()}-${String(startOfDay.getMonth() + 1).padStart(2, '0')}-${String(startOfDay.getDate()).padStart(2, '0')}`;

  return sendSuccess(res, {
    date: formattedDate,
    currency: settings.currency,
    metrics: {
      totalOrders,
      completedOrders,
      inProgressOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      totalSales: round2(totalDailySales),
      paymentSplit: {
        cash: {
          total: round2(cashSales),
          count: cashCount
        },
        upi: {
          total: round2(upiSales),
          count: upiCount
        }
      }
    },
    recentOrders
  });
};

module.exports = {
  getDailySalesReport
};
