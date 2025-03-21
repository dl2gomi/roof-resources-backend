const mongoose = require('mongoose');

// Define the Branch Schema
const branchSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, require: true },
    address: { type: String, require: true },
    merchantId: { type: String, default: null },
    isActive: { type: Boolean, default: false },
  },
  {
    collection: 'branches',
    timestamps: true,
  }
);

// Create the Branch model based on the schema
const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;
