const { z } = require('zod');

const updateSettingsSchema = z.object({
  body: z.object({
    restaurantName: z.string().trim().min(1).optional(),
    taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional(),
    currency: z.string().trim().min(1, 'Currency symbol required').max(5).optional(),
    staffDiscountLimit: z.coerce.number().min(0, 'Staff discount limit cannot be negative').max(100, 'Staff discount limit cannot exceed 100%').optional()
  })
});

module.exports = {
  updateSettingsSchema
};
