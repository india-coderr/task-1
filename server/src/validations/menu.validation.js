const { z } = require('zod');

const createMenuSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Item name is required' }).trim().min(2, 'Name must be at least 2 characters'),
    category: z.string({ required_error: 'Category is required' }).trim().min(1, 'Category is required'),
    price: z.coerce.number({ required_error: 'Price is required' }).min(0, 'Price cannot be negative'),
    description: z.string().trim().optional(),
    image: z.string().url('Image must be a valid URL').optional().or(z.literal('')),
    isAvailable: z.boolean().optional()
  })
});

const updateMenuSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Menu Item ID')
  }),
  body: z.object({
    name: z.string().trim().min(2).optional(),
    category: z.string().trim().min(1).optional(),
    price: z.coerce.number().min(0).optional(),
    description: z.string().trim().optional(),
    image: z.string().url().optional().or(z.literal('')),
    isAvailable: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
});

const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID')
  })
});

module.exports = {
  createMenuSchema,
  updateMenuSchema,
  idParamSchema
};
