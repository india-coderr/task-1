const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    nameSnapshot: {
      type: String,
      required: true
    },
    priceSnapshot: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['Cash', 'UPI'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paidAt: {
      type: Date,
      default: Date.now
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderType: {
      type: String,
      enum: {
        values: ['dine-in', 'takeaway'],
        message: 'Order type must be dine-in or takeaway'
      },
      required: [true, 'Order type is required']
    },
    tableNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (val) {
          // tableNumber is required if orderType is dine-in
          if (this.orderType === 'dine-in') {
            return typeof val === 'string' && val.trim().length > 0;
          }
          return true;
        },
        message: 'Table number is required for dine-in orders'
      }
    },
    customerName: {
      type: String,
      default: '',
      trim: true
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'Order must contain at least one item'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxRate: {
      type: Number,
      required: true,
      min: 0
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['none', 'percent', 'fixed'],
      default: 'none'
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Completed'],
      default: 'Pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Paid'],
      default: 'Unpaid',
      index: true
    },
    payment: {
      type: paymentSchema,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast dashboard and report aggregation
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: 1, paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
