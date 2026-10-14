import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Shop Rent', 'Electricity & Utilities', 'Staff Tea & Refreshments', 'Jewellery Boxes & Packing', 'Tools & Polishing', 'Marketing & Promotion', 'Security', 'Maintenance & Repairs', 'Miscellaneous'],
      default: 'Miscellaneous',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER'],
      default: 'CASH'
    },
    expenseDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    loggedByName: {
      type: String,
      default: 'Staff'
    }
  },
  {
    timestamps: true
  }
);

export const Expense = mongoose.model('Expense', expenseSchema);
