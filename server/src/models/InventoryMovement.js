import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    itemId: {
      type: String,
      required: true
    },
    barcode: {
      type: String,
      required: true
    },
    movementType: {
      type: String,
      enum: ['STOCK_IN', 'SALE', 'SALE_RETURN', 'PURCHASE_RETURN', 'ADJUSTMENT', 'PHYSICAL_AUDIT'],
      required: true,
      index: true
    },
    grossWeight: {
      type: Number,
      required: true
    },
    netGoldWeight: {
      type: Number,
      required: true
    },
    referenceType: {
      type: String,
      enum: ['PURCHASE', 'SALE', 'RETURN', 'MANUAL'],
      default: 'MANUAL'
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId
    },
    referenceNumber: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      default: ''
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: {
      type: String,
      default: 'Staff'
    }
  },
  {
    timestamps: true
  }
);

inventoryMovementSchema.index({ createdAt: -1 });

export const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
