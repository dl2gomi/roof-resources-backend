const mongoose = require('mongoose');

// Define the customer sub-schema
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, requried: true },
    address: { type: String, requried: true },
  },
  { _id: false }
);

// Define the pricing schema
const pricingSchema = new mongoose.Schema(
  {
    averageRetail: { type: Number, required: true },
    materials: { type: Number, required: true },
    dumpster: { type: Number, required: true },
    laborPermit: { type: Number, required: true },
  },
  { _id: false }
);

// Define the detail schema
const detailSchema = new mongoose.Schema(
  {
    house: { type: Number, required: true },
    percentWaste: { type: Number, required: true },
    squares: { type: Number, required: true },
    garage: { type: Boolean, default: null },
    shed: { type: Boolean, default: null },
    flatroof: { type: Boolean, default: null },
    skylight: { type: Boolean, default: null },
  },
  { _id: false }
);

// Define the options schema
const optionsSchema = new mongoose.Schema(
  {
    deluxeTearOff: { type: Boolean, default: false },
    roofDeck: { type: Boolean, default: false },
    ridgeVent: { type: Boolean, default: false },
    installFollow: { type: Boolean, default: false },
    estimate: { type: Boolean, default: false },
    exhaustVent: { type: Boolean, default: false },
  },
  { _id: false }
);

// Define the proposal schema
const proposalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    isSent: { type: Boolean, default: false },
    customer: customerSchema,
    pricing: pricingSchema,
    detail: detailSchema,
    options: optionsSchema,
  },
  {
    collection: 'proposals',
    timestamps: true,
  }
);

// Create the Proposal model based on the schema
const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;
