const mongoose = require('mongoose');

// Define the Profile sub-schema
const profileSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    phone: { type: String, default: null },
    avatar: { type: Buffer, default: null },
  },
  { _id: false }
);

// Define the user's franchise schema
const franchiseSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'], // Only these values are allowed
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true }, // unique index
    password: { type: String, required: true },
    profile: profileSchema,
    franchise: franchiseSchema,
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

// Create the User model based on the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
