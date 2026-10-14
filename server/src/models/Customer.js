import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: 'Rajasthan'
    },
    stateCode: {
      type: String,
      default: '08'
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    aadhaar: {
      type: String,
      trim: true,
      default: ''
    },
    openingBalance: {
      type: Number,
      default: 0 // positive = customer has advance deposit with shop, negative = customer owes shop
    },
    currentBalance: {
      type: Number,
      default: 0 // positive = customer credit/advance, negative = outstanding amount customer owes
    },
    totalPurchases: {
      type: Number,
      default: 0
    },
    totalBillsCount: {
      type: Number,
      default: 0
    },
    lastPurchaseDate: {
      type: Date
    },
    customerType: {
      type: String,
      enum: ['REGULAR', 'REPEAT', 'VIP'],
      default: 'REGULAR'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

customerSchema.index({ name: 'text', phone: 'text' });

export const Customer = mongoose.model('Customer', customerSchema);
