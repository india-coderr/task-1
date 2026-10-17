const AppError = require('./errors');

/**
 * Helper to round values to exactly 2 decimal places to avoid IEEE 754 floating point inaccuracies.
 * @param {number} num
 * @returns {number}
 */
const round2 = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

/**
 * Reusable billing calculation engine.
 * Never trusts client amounts. Strictly recalculates subtotal, discount, tax, and final total
 * using verified item prices fetched directly from the database.
 *
 * @param {Array<{menuItemId: string, quantity: number, menuItemDoc: Object}>} resolvedItems
 * @param {number} taxRate - Tax percentage (e.g. 5 for 5%)
 * @param {string} discountType - 'none' | 'percent' | 'fixed'
 * @param {number} discountValue - Value of discount (e.g. 10 for 10% or 10.00)
 * @param {Object} options - { userRole: 'admin'|'staff', staffDiscountLimit: number }
 * @returns {Object} Calculated billing breakdown and snapshot items
 */
function calculateOrderBilling(
  resolvedItems,
  taxRate = 5,
  discountType = 'none',
  discountValue = 0,
  options = {}
) {
  if (!resolvedItems || !Array.isArray(resolvedItems) || resolvedItems.length === 0) {
    throw new AppError('Order must contain at least one item', 400, 'EMPTY_ORDER_ITEMS');
  }

  let subtotal = 0;
  const itemsSnapshot = [];

  // 1. Calculate line totals and build immutable snapshots
  for (const item of resolvedItems) {
    const qty = parseInt(item.quantity, 10);
    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      throw new AppError(
        `Quantity for item '${item.menuItemDoc ? item.menuItemDoc.name : item.menuItemId}' must be a positive integer`,
        400,
        'INVALID_QUANTITY'
      );
    }

    if (!item.menuItemDoc) {
      throw new AppError(`Menu item ${item.menuItemId} not found`, 404, 'ITEM_NOT_FOUND');
    }

    if (!item.menuItemDoc.isActive || !item.menuItemDoc.isAvailable) {
      throw new AppError(
        `Menu item '${item.menuItemDoc.name}' is currently unavailable or inactive`,
        400,
        'ITEM_UNAVAILABLE'
      );
    }

    const priceSnapshot = round2(item.menuItemDoc.price);
    const lineTotal = round2(priceSnapshot * qty);
    subtotal = round2(subtotal + lineTotal);

    itemsSnapshot.push({
      menuItemId: item.menuItemDoc._id,
      nameSnapshot: item.menuItemDoc.name,
      priceSnapshot,
      quantity: qty,
      lineTotal
    });
  }

  // 2. Validate and calculate discount
  const validDiscountTypes = ['none', 'percent', 'fixed'];
  const type = validDiscountTypes.includes(discountType) ? discountType : 'none';
  let discValue = Math.max(0, Number(discountValue) || 0);
  let discountAmount = 0;

  if (type === 'percent') {
    if (discValue > 100) {
      throw new AppError('Percentage discount cannot exceed 100%', 400, 'INVALID_DISCOUNT');
    }

    // Role check: Staff cannot exceed staffDiscountLimit unless Admin
    if (options.userRole === 'staff' && options.staffDiscountLimit !== undefined) {
      if (discValue > options.staffDiscountLimit) {
        throw new AppError(
          `Staff discount limit is ${options.staffDiscountLimit}%. An admin must apply discounts above this limit.`,
          403,
          'STAFF_DISCOUNT_LIMIT_EXCEEDED'
        );
      }
    }

    discountAmount = round2((subtotal * discValue) / 100);
  } else if (type === 'fixed') {
    // Role check: If fixed discount percentage equivalent exceeds staffDiscountLimit
    if (options.userRole === 'staff' && options.staffDiscountLimit !== undefined && subtotal > 0) {
      const equivPercent = (discValue / subtotal) * 100;
      if (equivPercent > options.staffDiscountLimit) {
        throw new AppError(
          `Discount exceeds staff limit of ${options.staffDiscountLimit}%. Admin approval required.`,
          403,
          'STAFF_DISCOUNT_LIMIT_EXCEEDED'
        );
      }
    }

    discountAmount = round2(discValue);
  }

  if (discountAmount > subtotal) {
    throw new AppError('Discount amount cannot exceed the subtotal', 400, 'DISCOUNT_EXCEEDS_SUBTOTAL');
  }

  // 3. Calculate Tax on the discounted subtotal
  const taxableSubtotal = round2(subtotal - discountAmount);
  const validatedTaxRate = Math.max(0, Number(taxRate) || 0);
  const taxAmount = round2((taxableSubtotal * validatedTaxRate) / 100);

  // 4. Calculate Final Total
  const total = round2(taxableSubtotal + taxAmount);

  return {
    items: itemsSnapshot,
    subtotal,
    taxRate: validatedTaxRate,
    taxAmount,
    discountType: type,
    discountValue: discValue,
    discountAmount,
    total
  };
}

module.exports = {
  round2,
  calculateOrderBilling
};
