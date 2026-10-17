const MenuItem = require('../models/MenuItem');
const AppError = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

/**
 * Get all menu items with search and category filtering.
 * If user is staff or query specifies `activeOnly=true`, only active & available items are returned.
 */
const getMenu = async (req, res, next) => {
  const { search, category, activeOnly, availableOnly } = req.query;

  const query = {};

  // For order creation or when non-admin views the menu, filter out inactive items
  const isStaffOrOrder = req.userRole === 'staff' || activeOnly === 'true';
  if (isStaffOrOrder) {
    query.isActive = true;
    if (availableOnly !== 'false') {
      // In ordering context, only available items can be selected
      query.isAvailable = true;
    }
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { name: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } }
    ];
  }

  const items = await MenuItem.find(query).sort({ category: 1, name: 1 });

  // Also collect distinct categories for easy frontend filtering
  const categories = await MenuItem.distinct('category', { isActive: true });

  return sendSuccess(res, {
    items,
    categories: ['All', ...categories]
  });
};

/**
 * Create a new menu item (Admin only).
 */
const createMenuItem = async (req, res, next) => {
  const { name, category, price, description, image, isAvailable } = req.body;

  const item = await MenuItem.create({
    name,
    category,
    price,
    description: description || '',
    image: image || '',
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    isActive: true
  });

  return sendSuccess(res, item, 201);
};

/**
 * Update an existing menu item (Admin only).
 */
const updateMenuItem = async (req, res, next) => {
  const { id } = req.params;

  const item = await MenuItem.findById(id);
  if (!item) {
    return next(new AppError('Menu item not found.', 404, 'ITEM_NOT_FOUND'));
  }

  // Update provided fields
  const allowedFields = ['name', 'category', 'price', 'description', 'image', 'isAvailable', 'isActive'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      item[field] = req.body[field];
    }
  });

  await item.save();

  return sendSuccess(res, item);
};

/**
 * Deactivate or soft-delete a menu item (Admin only).
 * Sets isActive to false, hiding it from order creation.
 */
const deactivateMenuItem = async (req, res, next) => {
  const { id } = req.params;

  const item = await MenuItem.findById(id);
  if (!item) {
    return next(new AppError('Menu item not found.', 404, 'ITEM_NOT_FOUND'));
  }

  // Toggle or set isActive to false
  item.isActive = false;
  await item.save();

  return sendSuccess(res, {
    message: `Menu item '${item.name}' has been deactivated.`,
    item
  });
};

module.exports = {
  getMenu,
  createMenuItem,
  updateMenuItem,
  deactivateMenuItem
};
