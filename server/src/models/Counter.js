const mongoose = require('mongoose');

/**
 * Counter model for atomic sequence generation (e.g. order numbers).
 */
const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model('Counter', counterSchema);
