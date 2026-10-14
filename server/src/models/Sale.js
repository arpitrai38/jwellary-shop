import mongoose from 'mongoose';

const saleItemSnapshotSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  itemId: { type: String, required: true },
  barcode: { type: String, required: true },
  name: { type: String, required: true },
  categoryName: { type: String, default: '' },
  purity: { type: String, required: true },
  grossWeight: { type: Number, default: 0 },
  stoneWeight: { type: Number, default: 0 },
  netGoldWeight: { type: Number, default: 0 },
  huid: { type: String, default: '' },
  pricingType: { type: String, enum: ['WEIGHT_BASED', 'FIXED'], default: 'WEIGHT_BASED' },
  goldRatePerGram: { type: Number, default: 0 },
  metalValue: { type: Number, default: 0 },
  makingChargeType: { type: String, default: 'PER_GRAM' },
  makingChargeValue: { type: Number, default: 0 },
  makingCharge: { type: Number, default: 0 },
  wastagePercent: { type: Number, default: 0 },
  wastageValue: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  lineTotal: { type: Number, required: true }
});

const paymentSplitSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'ADVANCE_ADJUSTMENT'],
    required: true
  },
  amount: { type: Number, required: true },
  referenceNumber: { type: String, default: '' }
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    customerSnapshot: {
      name: { type: String, default: 'Walk-in Customer' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: 'Rajasthan' },
      stateCode: { type: String, default: '08' },
      pan: { type: String, default: '' },
      aadhaar: { type: String, default: '' }
    },
    items: [saleItemSnapshotSchema],
    totalPieces: {
      type: Number,
      default: 1
    },
    totalGrossWeight: {
      type: Number,
      default: 0
    },
    totalNetWeight: {
      type: Number,
      default: 0
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    taxableAmount: {
      type: Number,
      required: true,
      default: 0
    },
    isInterState: {
      type: Boolean,
      default: false
    },
    cgstRate: {
      type: Number,
      default: 1.5
    },
    cgstAmount: {
      type: Number,
      default: 0
    },
    sgstRate: {
      type: Number,
      default: 1.5
    },
    sgstAmount: {
      type: Number,
      default: 0
    },
    igstRate: {
      type: Number,
      default: 3.0
    },
    igstAmount: {
      type: Number,
      default: 0
    },
    totalTax: {
      type: Number,
      default: 0
    },
    roundOff: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
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
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      default: 'PAID'
    },
    paymentBreakdown: [paymentSplitSchema],
    status: {
      type: String,
      enum: ['COMPLETED', 'DRAFT', 'CANCELLED', 'RETURNED'],
      default: 'COMPLETED',
      index: true
    },
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cashierName: {
      type: String,
      default: 'Cashier'
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

saleSchema.index({ customer: 1, invoiceDate: -1 });
saleSchema.index({ status: 1, invoiceDate: -1 });

export const Sale = mongoose.model('Sale', saleSchema);
