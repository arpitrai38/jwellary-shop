import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    defaultMakingChargeType: {
      type: String,
      enum: ['PER_GRAM', 'PERCENTAGE', 'FIXED'],
      default: 'PER_GRAM'
    },
    defaultMakingChargeValue: {
      type: Number,
      default: 650
    },
    defaultWastagePercent: {
      type: Number,
      default: 0
    },
    hsnCode: {
      type: String,
      default: '7113'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Category = mongoose.model('Category', categorySchema);
