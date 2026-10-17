const Counter = require('../models/Counter');

/**
 * Atomically generates a sequential, unique order number formatted like:
 * ORD-YYYYMMDD-0001
 * Uses MongoDB findOneAndUpdate with upsert: true and $inc for atomic incrementing.
 *
 * @returns {Promise<string>}
 */
async function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateKey = `${year}${month}${day}`;
  const counterId = `order_${dateKey}`;

  // Atomically increment counter for this day
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `ORD-${dateKey}-${paddedSeq}`;
}

module.exports = {
  generateOrderNumber
};
