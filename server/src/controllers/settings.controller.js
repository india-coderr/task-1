const Settings = require('../models/Settings');
const { sendSuccess } = require('../utils/response');

/**
 * Get current POS settings.
 */
const getSettings = async (req, res, next) => {
  const settings = await Settings.getSettings();
  return sendSuccess(res, settings);
};

/**
 * Update POS settings (Admin only).
 */
const updateSettings = async (req, res, next) => {
  const { taxRate, currency, staffDiscountLimit, restaurantName } = req.body;

  let settings = await Settings.getSettings();

  if (taxRate !== undefined) settings.taxRate = taxRate;
  if (currency !== undefined) settings.currency = currency;
  if (staffDiscountLimit !== undefined) settings.staffDiscountLimit = staffDiscountLimit;
  if (restaurantName !== undefined) settings.restaurantName = restaurantName;

  await settings.save();

  return sendSuccess(res, settings);
};

module.exports = {
  getSettings,
  updateSettings
};
