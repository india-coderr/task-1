const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      default: 'Foodly Kitchen'
    },
    taxRate: {
      type: Number,
      required: true,
      default: 5,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%']
    },
    currency: {
      type: String,
      default: '₹',
      trim: true
    },
    staffDiscountLimit: {
      type: Number,
      default: 15, // Max % discount a staff member can apply without admin authorization
      min: [0, 'Staff discount limit cannot be negative'],
      max: [100, 'Staff discount limit cannot exceed 100%']
    }
  },
  {
    timestamps: true
  }
);

// Helper static method to get or create the singleton settings document
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      restaurantName: 'Foodly Kitchen',
      taxRate: 5,
      currency: '₹',
      staffDiscountLimit: 15
    });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
