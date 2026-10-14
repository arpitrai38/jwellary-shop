import mongoose from 'mongoose';

const salesReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true
    },
    invoiceNumber: {
      type: String,
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    returnedItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        itemId: String,
        barcode: String,
        name: String,
        refundAmount: Number,
        restockInventory: {
          type: Boolean,
          default: true
        }
      }
    ],
    totalRefundAmount: {
      type: Number,
      required: true
    },
    refundMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'STORE_CREDIT'],
      default: 'CASH'
    },
    reason: {
      type: String,
      default: ''
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

export const SalesReturn = mongoose.model('SalesReturn', salesReturnSchema);
