import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    paymentType: {
      type: String,
      enum: [
        'INCOMING_SALE',
        'OUTGOING_SUPPLIER',
        'CUSTOMER_ADVANCE',
        'CUSTOMER_DUE_PAYMENT',
        'SUPPLIER_PAYMENT',
        'SALE_REFUND',
        'PURCHASE_REFUND'
      ],
      required: true,
      index: true
    },
    partyType: {
      type: String,
      enum: ['CUSTOMER', 'SUPPLIER', 'OTHER'],
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale'
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER'],
      default: 'CASH'
    },
    transactionRef: {
      type: String,
      trim: true,
      default: ''
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: {
      type: String,
      default: 'Cashier'
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ customer: 1, paymentDate: -1 });
paymentSchema.index({ supplier: 1, paymentDate: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
