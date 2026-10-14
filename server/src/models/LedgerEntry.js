import mongoose from 'mongoose';

const ledgerEntrySchema = new mongoose.Schema(
  {
    partyType: {
      type: String,
      enum: ['CUSTOMER', 'SUPPLIER'],
      required: true,
      index: true
    },
    partyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    entryDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    entryType: {
      type: String,
      enum: ['DEBIT', 'CREDIT'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    runningBalance: {
      type: Number,
      required: true
    },
    referenceType: {
      type: String,
      enum: ['INVOICE', 'PURCHASE', 'PAYMENT', 'RETURN', 'OPENING_BALANCE', 'ADJUSTMENT'],
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    referenceNumber: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

ledgerEntrySchema.index({ partyId: 1, entryDate: 1 });

export const LedgerEntry = mongoose.model('LedgerEntry', ledgerEntrySchema);
