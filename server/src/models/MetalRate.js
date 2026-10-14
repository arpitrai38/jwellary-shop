import mongoose from 'mongoose';

const metalRateSchema = new mongoose.Schema(
  {
    metal: {
      type: String,
      enum: ['GOLD'],
      default: 'GOLD'
    },
    purity: {
      type: String,
      enum: ['24K', '22K', '18K', '14K'],
      required: true
    },
    fineness: {
      type: Number, // 999 for 24K, 916 for 22K, 750 for 18K, 585 for 14K
      required: true
    },
    ratePerGram: {
      type: Number,
      required: [true, 'Rate per gram is required'],
      min: 0
    },
    effectiveFrom: {
      type: Date,
      default: Date.now
    },
    isCurrent: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedByName: {
      type: String,
      default: 'Authorized Admin'
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

metalRateSchema.index({ metal: 1, purity: 1, isCurrent: 1 });
metalRateSchema.index({ effectiveFrom: -1 });

export const MetalRate = mongoose.model('MetalRate', metalRateSchema);
