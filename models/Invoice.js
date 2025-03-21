const mongoose = require('mongoose');

// Define the Invoice Schema
const invoiceSchema = new mongoose.Schema(
  {
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal',
      required: true,
    },
    paidAt: { type: Date, default: null },
    via: { type: String, default: null },
    amount: { type: Number, default: null },
  },
  {
    collection: 'invoices',
    timestamps: true,
  }
);

// Create the Branch model based on the schema
const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
