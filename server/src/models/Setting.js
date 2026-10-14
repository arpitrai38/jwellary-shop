import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'main_shop_config'
    },
    shopName: {
      type: String,
      default: 'My Jewellery Shop'
    },
    tagline: {
      type: String,
      default: 'Jewellery business command center'
    },
    ownerName: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
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
      default: ''
    },
    stateCode: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    },
    gstin: {
      type: String,
      default: ''
    },
    pan: {
      type: String,
      default: ''
    },
    bankName: {
      type: String,
      default: 'State Bank of India'
    },
    accountNumber: {
      type: String,
      default: '123456789012'
    },
    ifscCode: {
      type: String,
      default: 'SBIN0001234'
    },
    upiId: {
      type: String,
      default: 'aarnajewar@sbi'
    },
    // Tax Configuration
    cgstRate: {
      type: Number,
      default: 1.5
    },
    sgstRate: {
      type: Number,
      default: 1.5
    },
    igstRate: {
      type: Number,
      default: 3.0
    },
    hsnCode: {
      type: String,
      default: '7113'
    },
    // Tag printing defaults
    tagWidthMm: {
      type: Number,
      default: 50
    },
    tagHeightMm: {
      type: Number,
      default: 25
    },
    showShopNameOnTag: {
      type: Boolean,
      default: true
    },
    showPriceOnTag: {
      type: Boolean,
      default: true
    },
    showWeightOnTag: {
      type: Boolean,
      default: true
    },
    showPurityOnTag: {
      type: Boolean,
      default: true
    },
    // Counters
    lastInvoiceSeq: {
      type: Number,
      default: 1024
    },
    lastPurchaseSeq: {
      type: Number,
      default: 100
    },
    lastItemSeq: {
      type: Number,
      default: 127
    }
  },
  {
    timestamps: true
  }
);

export const Setting = mongoose.model('Setting', settingSchema);
