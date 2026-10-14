import { Purchase } from '../models/Purchase.js';
import { Product } from '../models/Product.js';
import { Supplier } from '../models/Supplier.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Payment } from '../models/Payment.js';
import { Setting } from '../models/Setting.js';
import { Category } from '../models/Category.js';
import { roundWeight, roundMoney } from '../utils/decimalUtil.js';
import { logAudit } from '../utils/auditLogger.js';

export const getPurchases = async (req, res, next) => {
  try {
    const { supplier, page = 1, limit = 50 } = req.query;
    const query = {};
    if (supplier) query.supplier = supplier;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [purchases, total] = await Promise.all([
      Purchase.find(query).sort({ purchaseDate: -1 }).skip(skip).limit(limitNum).populate('supplier', 'name phone gstin'),
      Purchase.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: purchases,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('supplier').populate('items.product');
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }
    res.json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

export const createPurchase = async (req, res, next) => {
  try {
    const {
      supplierId,
      supplierInvoiceNo,
      purchaseDate,
      pricingMode = 'Manual Selling Price',
      items = [], // array of items: name, category, purity, grossWeight, stoneWeight, purchaseCost, sellingPrice, huid, designNumber
      paidAmount = 0,
      paymentMethod = 'BANK_TRANSFER',
      paymentRef = '',
      notes
    } = req.body;

    if (!supplierId) {
      return res.status(400).json({ success: false, message: 'Supplier is required' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required in purchase inward' });
    }

    // Get sequence numbers
    const setting = await Setting.findOneAndUpdate(
      { key: 'main_shop_config' },
      { $inc: { lastPurchaseSeq: 1 } },
      { new: true, upsert: true }
    );

    const purchaseNumber = `PUR-${String(setting.lastPurchaseSeq).padStart(4, '0')}`;

    let totalGross = 0;
    let totalNet = 0;
    let subtotalCost = 0;
    const createdPurchaseItems = [];

    for (const item of items) {
      // Find or assign category
      let categoryId = item.category;
      let categoryName = item.categoryName || '';

      if (!categoryId) {
        const cat = await Category.findOne({ name: new RegExp(`^${item.categoryName || 'Ring'}$`, 'i') });
        if (cat) {
          categoryId = cat._id;
          categoryName = cat.name;
        } else {
          const defaultCat = await Category.findOne();
          categoryId = defaultCat?._id;
          categoryName = defaultCat?.name || 'Jewellery';
        }
      }

      // Increment product sequence
      const updatedSetting = await Setting.findOneAndUpdate(
        { key: 'main_shop_config' },
        { $inc: { lastItemSeq: 1 } },
        { new: true }
      );

      const seq = updatedSetting.lastItemSeq;
      const itemId = `JWL-${String(seq).padStart(5, '0')}`;
      const barcode = `JWL${String(seq).padStart(5, '0')}`;

      const gross = roundWeight(item.grossWeight || 0);
      const stone = roundWeight(item.stoneWeight || 0);
      const netGold = roundWeight(gross - stone);
      const cost = roundMoney(item.purchaseCost || 0);
      const selling = roundMoney(item.sellingPrice || cost * 1.3);

      totalGross = roundWeight(totalGross + gross);
      totalNet = roundWeight(totalNet + netGold);
      subtotalCost = roundMoney(subtotalCost + cost);

      // Create individual Product record
      const product = await Product.create({
        itemId,
        barcode,
        name: item.name || `${categoryName} Piece`,
        category: categoryId,
        categoryName,
        designNumber: item.designNumber || '',
        purity: item.purity || '22K',
        grossWeight: gross,
        stoneWeight: stone,
        netGoldWeight: netGold,
        huid: (item.huid || '').toUpperCase(),
        pricingType: item.pricingType || (pricingMode === 'Weight-based' ? 'WEIGHT_BASED' : 'FIXED'),
        fixedSellingPrice: selling,
        makingChargeType: item.makingChargeType || 'PER_GRAM',
        makingChargeValue: item.makingChargeValue || 0,
        wastagePercent: item.wastagePercent || 0,
        purchaseCost: cost,
        sellingPriceEstimate: selling,
        tagStatus: 'PENDING',
        stockStatus: 'AVAILABLE',
        supplier: supplier._id,
        supplierName: supplier.name
      });

      // Record movement
      await InventoryMovement.create({
        product: product._id,
        itemId: product.itemId,
        barcode: product.barcode,
        movementType: 'STOCK_IN',
        grossWeight: product.grossWeight,
        netGoldWeight: product.netGoldWeight,
        referenceType: 'PURCHASE',
        referenceNumber: purchaseNumber,
        reason: `Stock Inward via Purchase ${purchaseNumber}`,
        performedBy: req.user?._id,
        performedByName: req.user?.name || 'Staff'
      });

      createdPurchaseItems.push({
        product: product._id,
        itemId: product.itemId,
        barcode: product.barcode,
        name: product.name,
        categoryName: product.categoryName,
        purity: product.purity,
        grossWeight: product.grossWeight,
        stoneWeight: product.stoneWeight,
        netGoldWeight: product.netGoldWeight,
        purchaseCost: product.purchaseCost,
        sellingPrice: product.fixedSellingPrice,
        huid: product.huid
      });
    }

    const totalAmount = subtotalCost;
    const paid = roundMoney(Math.min(paidAmount || 0, totalAmount));
    const balanceDue = roundMoney(totalAmount - paid);
    const paymentStatus = balanceDue === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';

    const purchase = await Purchase.create({
      purchaseNumber,
      supplier: supplier._id,
      supplierName: supplier.name,
      supplierInvoiceNo: supplierInvoiceNo || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      pricingMode,
      items: createdPurchaseItems,
      totalPieces: createdPurchaseItems.length,
      totalGrossWeight: totalGross,
      totalNetWeight: totalNet,
      subtotalCost,
      taxAmount: 0,
      totalAmount,
      paidAmount: paid,
      balanceDue,
      paymentStatus,
      receivedBy: req.user?._id,
      receivedByName: req.user?.name || 'Staff',
      notes: notes || ''
    });

    // Link purchase to created products
    await Product.updateMany(
      { _id: { $in: createdPurchaseItems.map((i) => i.product) } },
      { $set: { purchaseRef: purchase._id } }
    );

    // Update supplier ledger
    // Entry 1: Credit purchase amount to supplier payable
    const prevPayable = supplier.currentPayable || 0;
    const newPayableAfterBill = roundMoney(prevPayable + totalAmount);

    await LedgerEntry.create({
      partyType: 'SUPPLIER',
      partyId: supplier._id,
      entryDate: purchase.purchaseDate,
      entryType: 'CREDIT',
      amount: totalAmount,
      runningBalance: newPayableAfterBill,
      referenceType: 'PURCHASE',
      referenceId: purchase._id,
      referenceNumber: purchaseNumber,
      description: `Purchase Inward #${purchaseNumber} (${createdPurchaseItems.length} pcs, ${totalNet}g)`,
      createdBy: req.user?._id
    });

    let runningPayable = newPayableAfterBill;

    // Entry 2: If payment made immediately
    if (paid > 0) {
      runningPayable = roundMoney(runningPayable - paid);

      const paySetting = await Setting.findOneAndUpdate(
        { key: 'main_shop_config' },
        { $inc: { lastPaymentSeq: 1 } },
        { new: true, upsert: true }
      );
      const payNumber = `PAY-${String(paySetting.lastPaymentSeq || 1001).padStart(4, '0')}`;

      await Payment.create({
        paymentNumber: payNumber,
        paymentType: 'SUPPLIER_PAYMENT',
        partyType: 'SUPPLIER',
        supplier: supplier._id,
        purchase: purchase._id,
        amount: paid,
        paymentMethod,
        transactionRef: paymentRef,
        notes: `Payment for purchase #${purchaseNumber}`,
        performedBy: req.user?._id,
        performedByName: req.user?.name || 'Staff'
      });

      await LedgerEntry.create({
        partyType: 'SUPPLIER',
        partyId: supplier._id,
        entryDate: new Date(),
        entryType: 'DEBIT',
        amount: paid,
        runningBalance: runningPayable,
        referenceType: 'PAYMENT',
        referenceId: purchase._id,
        referenceNumber: payNumber,
        description: `Payment disbursed via ${paymentMethod} (Ref: ${paymentRef || 'N/A'})`,
        createdBy: req.user?._id
      });
    }

    // Update supplier totals
    supplier.currentPayable = runningPayable;
    supplier.totalPurchased = roundMoney((supplier.totalPurchased || 0) + totalAmount);
    supplier.totalPaid = roundMoney((supplier.totalPaid || 0) + paid);
    supplier.lastPurchaseDate = purchase.purchaseDate;
    await supplier.save();

    await logAudit({
      req,
      action: 'STOCK_INWARD_PURCHASE',
      resource: 'Purchase',
      resourceId: purchase._id,
      details: { purchaseNumber, totalPieces: purchase.totalPieces, totalAmount }
    });

    res.status(201).json({
      success: true,
      message: `Stock inward completed! ${createdPurchaseItems.length} items added to inventory with unique barcodes.`,
      data: purchase
    });
  } catch (error) {
    next(error);
  }
};
