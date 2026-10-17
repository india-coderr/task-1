const { z } = require('zod');

const orderItemInputSchema = z
  .object({
    menuItemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid menuItemId format').optional(),
    menuItem: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid menuItem format').optional(),
    quantity: z.coerce.number().int('Quantity must be an integer').positive('Quantity must be greater than 0')
  })
  .refine((data) => data.menuItemId || data.menuItem, {
    message: 'Either menuItemId or menuItem is required',
    path: ['menuItemId']
  })
  .transform((data) => ({
    menuItemId: data.menuItemId || data.menuItem,
    quantity: data.quantity
  }));

const createOrderSchema = z.object({
  body: z
    .object({
      orderType: z.enum(['dine-in', 'takeaway'], {
        errorMap: () => ({ message: 'orderType must be dine-in or takeaway' })
      }),
      tableNumber: z.string().trim().optional(),
      customerName: z.string().trim().optional(),
      items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
      discountType: z.enum(['none', 'percent', 'fixed']).optional().default('none'),
      discountValue: z.coerce.number().min(0).optional().default(0)
    })
    .refine(
      (data) => {
        if (data.orderType === 'dine-in') {
          return typeof data.tableNumber === 'string' && data.tableNumber.trim().length > 0;
        }
        return true;
      },
      {
        message: 'tableNumber is required for dine-in orders',
        path: ['tableNumber']
      }
    )
});

const updateOrderItemsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID')
  }),
  body: z.object({
    items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item'),
    discountType: z.enum(['none', 'percent', 'fixed']).optional(),
    discountValue: z.coerce.number().min(0).optional()
  })
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID')
  }),
  body: z.object({
    status: z.enum(['Pending', 'Preparing', 'Ready', 'Completed'], {
      errorMap: () => ({ message: 'Status must be Pending, Preparing, Ready, or Completed' })
    })
  })
});

const recordPaymentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Order ID')
  }),
  body: z.object({
    method: z.enum(['Cash', 'UPI'], {
      errorMap: () => ({ message: 'Payment method must be Cash or UPI' })
    }),
    amount: z.coerce.number({ required_error: 'Payment amount is required' }).min(0, 'Payment amount cannot be negative')
  })
});

const queryOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['Pending', 'Preparing', 'Ready', 'Completed']).optional(),
    paymentStatus: z.enum(['Unpaid', 'Paid']).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20)
  })
});

module.exports = {
  createOrderSchema,
  updateOrderItemsSchema,
  updateStatusSchema,
  recordPaymentSchema,
  queryOrdersSchema
};
