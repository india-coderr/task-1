const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    image: {
      type: String,
      default: ''
    },
    imageAttribution: {
      text: { type: String, default: '' },
      html: { type: String, default: '' },
      photographerName: { type: String, default: '' },
      photographerUrl: { type: String, default: '' }
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for menu browsing and filtering
menuItemSchema.index({ category: 1, isActive: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
