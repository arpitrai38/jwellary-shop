import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: [true, 'Unique Item ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    barcode: {
      type: String,
      required: [true, 'Unique Barcode is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    categoryName: {
      type: String,
      default: ''
    },
    designNumber: {
      type: String,
      trim: true,
      default: ''
    },
    purity: {
      type: String,
      enum: ['24K', '22K', '18K', '14K'],
      default: '22K',
      required: true
    },
    grossWeight: {
      type: Number,
      required: [true, 'Gross weight is required'],
      min: 0
    },
    stoneWeight: {
      type: Number,
      default: 0,
      min: 0
    },
    netGoldWeight: {
      type: Number,
      required: [true, 'Net gold weight is required'],
      min: 0
    },
    huid: {
      type: String,
      trim: true,
      uppercase: true,
      default: '' // Hallmark Unique ID
    },
    pricingType: {
      type: String,
      enum: ['WEIGHT_BASED', 'FIXED'],
      default: 'WEIGHT_BASED'
    },
    fixedSellingPrice: {
      type: Number,
      default: 0
    },
    makingChargeType: {
      type: String,
      enum: ['PER_GRAM', 'PERCENTAGE', 'FIXED'],
      default: 'PER_GRAM'
    },
    makingChargeValue: {
      type: Number,
      default: 0
    },
    wastagePercent: {
      type: Number,
      default: 0
    },
    purchaseCost: {
      type: Number,
      default: 0
    },
    sellingPriceEstimate: {
      type: Number,
      default: 0
    },
    tagStatus: {
      type: String,
      enum: ['PENDING', 'PRINTED', 'VERIFIED'],
      default: 'PENDING',
      index: true
    },
    stockStatus: {
      type: String,
      enum: ['AVAILABLE', 'SOLD', 'RESERVED', 'RETURNED'],
      default: 'AVAILABLE',
      index: true
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    supplierName: {
      type: String,
      default: ''
    },
    purchaseRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase'
    },
    imageUrl: {
      type: String,
      default: ''
    },
    counterLocation: {
      type: String,
      default: 'Counter 1'
    },
    verifiedAt: {
      type: Date
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({ category: 1, stockStatus: 1 });
productSchema.index({ tagStatus: 1, stockStatus: 1 });

export const Product = mongoose.model('Product', productSchema);
