import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  itemId: String,
  barcode: String,
  name: String,
  categoryName: String,
  purity: String,
  grossWeight: Number,
  stoneWeight: Number,
  netGoldWeight: Number,
  purchaseCost: Number,
  sellingPrice: Number,
  huid: String
});

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    supplierName: {
      type: String,
      required: true
    },
    supplierInvoiceNo: {
      type: String,
      trim: true,
      default: ''
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    pricingMode: {
      type: String,
      enum: ['Manual Selling Price', 'Pricing Rule — Cost + %', 'Pricing Rule — Cost + Amount', 'Weight-based'],
      default: 'Manual Selling Price'
    },
    items: [purchaseItemSchema],
    totalPieces: {
      type: Number,
      default: 0
    },
    totalGrossWeight: {
      type: Number,
      default: 0
    },
    totalNetWeight: {
      type: Number,
      default: 0
    },
    subtotalCost: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    balanceDue: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID'],
      default: 'UNPAID'
    },
    status: {
      type: String,
      enum: ['RECEIVED', 'CANCELLED', 'RETURNED'],
      default: 'RECEIVED'
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receivedByName: {
      type: String,
      default: 'Staff'
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

purchaseSchema.index({ supplier: 1, purchaseDate: -1 });

export const Purchase = mongoose.model('Purchase', purchaseSchema);
