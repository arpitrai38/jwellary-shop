import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { MetalRate } from '../models/MetalRate.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { Payment } from '../models/Payment.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Setting } from '../models/Setting.js';
import { calculateItemPrice, calculateInvoiceTotals, roundMoney, roundWeight } from '../utils/decimalUtil.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Preview pricing engine calculation for POS cart
 */
export const calculatePricing = async (req, res, next) => {
  try {
    const { items = [], discount = 0, isInterState = false } = req.body;

    // Fetch current gold rates for all purities
    const currentRates = await MetalRate.find({ metal: 'GOLD', isCurrent: true });
    const rateMap = {};
    currentRates.forEach((r) => {
      rateMap[r.purity] = r.ratePerGram;
    });

    const calculatedItems = [];

    for (const item of items) {
      let product = null;
      if (item.productId) {
        product = await Product.findById(item.productId);
      } else if (item.barcode) {
        product = await Product.findOne({ $or: [{ barcode: item.barcode }, { itemId: item.barcode }] });
      }

      const purity = item.purity || product?.purity || '22K';
      const appliedRate = item.goldRatePerGram || rateMap[purity] || 6850;
      const pricingType = item.pricingType || product?.pricingType || 'WEIGHT_BASED';

      const gross = roundWeight(item.grossWeight !== undefined ? item.grossWeight : product?.grossWeight || 0);
      const stone = roundWeight(item.stoneWeight !== undefined ? item.stoneWeight : product?.stoneWeight || 0);
      const fixedPrice = roundMoney(item.fixedSellingPrice !== undefined ? item.fixedSellingPrice : product?.fixedSellingPrice || 0);

      const priceResult = calculateItemPrice({
        pricingType,
        fixedSellingPrice: fixedPrice,
        grossWeight: gross,
        stoneWeight: stone,
        goldRatePerGram: appliedRate,
        makingChargeType: item.makingChargeType || product?.makingChargeType || 'PER_GRAM',
        makingChargeValue: item.makingChargeValue !== undefined ? item.makingChargeValue : product?.makingChargeValue || 0,
        wastagePercent: item.wastagePercent !== undefined ? item.wastagePercent : product?.wastagePercent || 0,
        quantity: item.quantity || 1
      });

      calculatedItems.push({
        product: product?._id,
        itemId: product?.itemId || item.itemId || 'CUSTOM',
        barcode: product?.barcode || item.barcode || 'CUSTOM',
        name: product?.name || item.name || 'Gold Jewellery Item',
        categoryName: product?.categoryName || item.categoryName || '',
        purity,
        grossWeight: priceResult.grossWeight,
        stoneWeight: priceResult.stoneWeight,
        netGoldWeight: priceResult.netGoldWeight,
        huid: product?.huid || item.huid || '',
        pricingType: priceResult.pricingType,
        goldRatePerGram: priceResult.goldRatePerGram,
        metalValue: priceResult.metalValue,
        makingChargeType: priceResult.makingChargeType,
        makingChargeValue: priceResult.makingChargeValue,
        makingCharge: priceResult.makingCharge,
        wastagePercent: priceResult.wastagePercent,
        wastageValue: priceResult.wastageValue,
        unitPrice: priceResult.unitPrice,
        quantity: 1,
        lineTotal: priceResult.lineTotal
      });
    }

    const totals = calculateInvoiceTotals({
      items: calculatedItems,
      discount,
      isInterState
    });

    res.json({
      success: true,
      data: {
        items: calculatedItems,
        ...totals,
        rateMap
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Finalize and create completed sale invoice
 */
export const createSale = async (req, res, next) => {
  try {
    const {
      customerId,
      customerSnapshot,
      items = [],
      discount = 0,
      isInterState = false,
      paidAmount = 0,
      paymentMethod = 'CASH',
      paymentRef = '',
      notes
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required in the bill' });
    }

    // Verify stock availability: no double selling!
    const productIds = items.map((i) => i.productId || i.product).filter(Boolean);
    const existingProducts = await Product.find({ _id: { $in: productIds } });

    for (const p of existingProducts) {
      if (p.stockStatus !== 'AVAILABLE') {
        return res.status(400).json({
          success: false,
          message: `Item ${p.itemId} · ${p.name} is not available for sale (Current status: ${p.stockStatus})`
        });
      }
    }

    // Fetch latest gold rates
    const currentRates = await MetalRate.find({ metal: 'GOLD', isCurrent: true });
    const rateMap = {};
    currentRates.forEach((r) => {
      rateMap[r.purity] = r.ratePerGram;
    });

    // Generate safe sequential invoice number
    const setting = await Setting.findOneAndUpdate(
      { key: 'main_shop_config' },
      { $inc: { lastInvoiceSeq: 1 } },
      { new: true, upsert: true }
    );

    const invoiceNumber = `INV-${setting.lastInvoiceSeq}`;

    // Calculate line items snapshots
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    const finalItems = [];

    for (const item of items) {
      const prod = existingProducts.find((p) => String(p._id) === String(item.productId || item.product));

      const purity = item.purity || prod?.purity || '22K';
      const appliedRate = item.goldRatePerGram || rateMap[purity] || 6850;
      const pricingType = item.pricingType || prod?.pricingType || 'WEIGHT_BASED';
      const fixedPrice = roundMoney(item.fixedSellingPrice !== undefined ? item.fixedSellingPrice : prod?.fixedSellingPrice || 0);

      const gross = roundWeight(item.grossWeight !== undefined ? item.grossWeight : prod?.grossWeight || 0);
      const stone = roundWeight(item.stoneWeight !== undefined ? item.stoneWeight : prod?.stoneWeight || 0);

      const priceResult = calculateItemPrice({
        pricingType,
        fixedSellingPrice: fixedPrice,
        grossWeight: gross,
        stoneWeight: stone,
        goldRatePerGram: appliedRate,
        makingChargeType: item.makingChargeType || prod?.makingChargeType || 'PER_GRAM',
        makingChargeValue: item.makingChargeValue !== undefined ? item.makingChargeValue : prod?.makingChargeValue || 0,
        wastagePercent: item.wastagePercent !== undefined ? item.wastagePercent : prod?.wastagePercent || 0,
        quantity: 1
      });

      totalGrossWeight = roundWeight(totalGrossWeight + priceResult.grossWeight);
      totalNetWeight = roundWeight(totalNetWeight + priceResult.netGoldWeight);

      finalItems.push({
        product: prod?._id,
        itemId: prod?.itemId || item.itemId || 'JWL-CUSTOM',
        barcode: prod?.barcode || item.barcode || 'JWL-CUSTOM',
        name: prod?.name || item.name || 'Gold Jewellery Item',
        categoryName: prod?.categoryName || item.categoryName || '',
        purity,
        grossWeight: priceResult.grossWeight,
        stoneWeight: priceResult.stoneWeight,
        netGoldWeight: priceResult.netGoldWeight,
        huid: prod?.huid || item.huid || '',
        pricingType: priceResult.pricingType,
        goldRatePerGram: priceResult.goldRatePerGram,
        metalValue: priceResult.metalValue,
        makingChargeType: priceResult.makingChargeType,
        makingChargeValue: priceResult.makingChargeValue,
        makingCharge: priceResult.makingCharge,
        wastagePercent: priceResult.wastagePercent,
        wastageValue: priceResult.wastageValue,
        unitPrice: priceResult.unitPrice,
        quantity: 1,
        lineTotal: priceResult.lineTotal
      });
    }

    const totals = calculateInvoiceTotals({
      items: finalItems,
      discount,
      isInterState
    });

    const paid = roundMoney(Math.min(paidAmount !== undefined ? paidAmount : totals.grandTotal, totals.grandTotal));
    const balanceDue = roundMoney(totals.grandTotal - paid);
    const paymentStatus = balanceDue === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';

    // Handle Customer
    let customer = null;
    let customerData = {
      name: 'Walk-in Customer',
      phone: '',
      address: '',
      city: '',
      state: 'Rajasthan',
      stateCode: '08'
    };

    if (customerId) {
      customer = await Customer.findById(customerId);
      if (customer) {
        customerData = {
          name: customer.name,
          phone: customer.phone,
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || 'Rajasthan',
          stateCode: customer.stateCode || '08',
          pan: customer.pan || '',
          aadhaar: customer.aadhaar || ''
        };
      }
    } else if (customerSnapshot?.name) {
      customerData = {
        name: customerSnapshot.name,
        phone: customerSnapshot.phone || '',
        address: customerSnapshot.address || '',
        city: customerSnapshot.city || '',
        state: customerSnapshot.state || 'Rajasthan',
        stateCode: customerSnapshot.stateCode || '08',
        pan: customerSnapshot.pan || '',
        aadhaar: customerSnapshot.aadhaar || ''
      };
    }

    // Payment breakdown
    const paymentBreakdown = [];
    if (paid > 0) {
      paymentBreakdown.push({
        method: paymentMethod,
        amount: paid,
        referenceNumber: paymentRef || ''
      });
    }

    // Create Sale record
    const sale = await Sale.create({
      invoiceNumber,
      invoiceDate: new Date(),
      customer: customer?._id || null,
      customerSnapshot: customerData,
      items: finalItems,
      totalPieces: finalItems.length,
      totalGrossWeight,
      totalNetWeight,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxableAmount: totals.taxableAmount,
      isInterState: totals.isInterState,
      cgstRate: totals.cgstRate,
      cgstAmount: totals.cgstAmount,
      sgstRate: totals.sgstRate,
      sgstAmount: totals.sgstAmount,
      igstRate: totals.igstRate,
      igstAmount: totals.igstAmount,
      totalTax: totals.totalTax,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      paidAmount: paid,
      balanceDue,
      paymentStatus,
      paymentBreakdown,
      status: 'COMPLETED',
      cashier: req.user?._id,
      cashierName: req.user?.name || 'Cashier',
      notes: notes || ''
    });

    // Mark products as SOLD & record inventory movements
    for (const item of finalItems) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $set: { stockStatus: 'SOLD' }
        });

        await InventoryMovement.create({
          product: item.product,
          itemId: item.itemId,
          barcode: item.barcode,
          movementType: 'SALE',
          grossWeight: item.grossWeight,
          netGoldWeight: item.netGoldWeight,
          referenceType: 'SALE',
          referenceNumber: invoiceNumber,
          reason: `Sold on invoice #${invoiceNumber}`,
          performedBy: req.user?._id,
          performedByName: req.user?.name || 'Cashier'
        });
      }
    }

    // Customer ledger & payments update
    if (customer) {
      // 1. Debit customer for invoice grandTotal
      const prevBal = customer.currentBalance || 0;
      const newBalAfterInvoice = roundMoney(prevBal - totals.grandTotal); // negative means customer owes money

      await LedgerEntry.create({
        partyType: 'CUSTOMER',
        partyId: customer._id,
        entryDate: sale.invoiceDate,
        entryType: 'DEBIT',
        amount: totals.grandTotal,
        runningBalance: newBalAfterInvoice,
        referenceType: 'INVOICE',
        referenceId: sale._id,
        referenceNumber: invoiceNumber,
        description: `Tax Invoice #${invoiceNumber} (${finalItems.length} items, Net Wt: ${totalNetWeight}g)`,
        createdBy: req.user?._id
      });

      let runningBal = newBalAfterInvoice;

      // 2. Credit customer for payment received
      if (paid > 0) {
        runningBal = roundMoney(runningBal + paid);

        const paySetting = await Setting.findOneAndUpdate(
          { key: 'main_shop_config' },
          { $inc: { lastPaymentSeq: 1 } },
          { new: true, upsert: true }
        );
        const payNum = `REC-${String(paySetting.lastPaymentSeq || 1001).padStart(4, '0')}`;

        await Payment.create({
          paymentNumber: payNum,
          paymentType: 'INCOMING_SALE',
          partyType: 'CUSTOMER',
          customer: customer._id,
          sale: sale._id,
          amount: paid,
          paymentMethod,
          transactionRef: paymentRef,
          notes: `Payment for bill #${invoiceNumber}`,
          performedBy: req.user?._id,
          performedByName: req.user?.name || 'Cashier'
        });

        await LedgerEntry.create({
          partyType: 'CUSTOMER',
          partyId: customer._id,
          entryDate: new Date(),
          entryType: 'CREDIT',
          amount: paid,
          runningBalance: runningBal,
          referenceType: 'PAYMENT',
          referenceId: sale._id,
          referenceNumber: payNum,
          description: `Payment received via ${paymentMethod} (Ref: ${paymentRef || 'Cash'})`,
          createdBy: req.user?._id
        });
      }

      customer.currentBalance = runningBal;
      customer.totalPurchases = roundMoney((customer.totalPurchases || 0) + totals.grandTotal);
      customer.totalBillsCount = (customer.totalBillsCount || 0) + 1;
      customer.lastPurchaseDate = sale.invoiceDate;
      await customer.save();
    } else if (paid > 0) {
      // Walk-in payment recording
      const paySetting = await Setting.findOneAndUpdate(
        { key: 'main_shop_config' },
        { $inc: { lastPaymentSeq: 1 } },
        { new: true, upsert: true }
      );
      const payNum = `REC-${String(paySetting.lastPaymentSeq || 1001).padStart(4, '0')}`;

      await Payment.create({
        paymentNumber: payNum,
        paymentType: 'INCOMING_SALE',
        partyType: 'CUSTOMER',
        sale: sale._id,
        amount: paid,
        paymentMethod,
        transactionRef: paymentRef,
        notes: `Walk-in customer sale #${invoiceNumber}`,
        performedBy: req.user?._id,
        performedByName: req.user?.name || 'Cashier'
      });
    }

    await logAudit({
      req,
      action: 'SALE_COMPLETED',
      resource: 'Sale',
      resourceId: sale._id,
      details: { invoiceNumber, grandTotal: totals.grandTotal, itemsCount: finalItems.length }
    });

    res.status(201).json({
      success: true,
      message: `Invoice #${invoiceNumber} completed successfully`,
      data: sale
    });
  } catch (error) {
    next(error);
  }
};

export const getSales = async (req, res, next) => {
  try {
    const { search, customer, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    if (customer) query.customer = customer;

    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ invoiceNumber: reg }, { 'customerSnapshot.name': reg }, { 'customerSnapshot.phone': reg }];
    }

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [sales, total] = await Promise.all([
      Sale.find(query).sort({ invoiceDate: -1 }).skip(skip).limit(limitNum).populate('customer', 'name phone'),
      Sale.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: sales,
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

export const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('customer').populate('items.product');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

export const cancelSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    if (sale.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Invoice is already cancelled' });
    }

    sale.status = 'CANCELLED';
    await sale.save();

    // Restock items
    for (const item of sale.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $set: { stockStatus: 'AVAILABLE' }
        });

        await InventoryMovement.create({
          product: item.product,
          itemId: item.itemId,
          barcode: item.barcode,
          movementType: 'SALE_RETURN',
          grossWeight: item.grossWeight,
          netGoldWeight: item.netGoldWeight,
          referenceType: 'RETURN',
          referenceNumber: sale.invoiceNumber,
          reason: `Restocked due to invoice cancellation #${sale.invoiceNumber}`,
          performedBy: req.user?._id,
          performedByName: req.user?.name || 'Cashier'
        });
      }
    }

    await logAudit({
      req,
      action: 'SALE_CANCELLED',
      resource: 'Sale',
      resourceId: sale._id,
      details: { invoiceNumber: sale.invoiceNumber }
    });

    res.json({ success: true, message: `Invoice #${sale.invoiceNumber} has been cancelled and items restocked` });
  } catch (error) {
    next(error);
  }
};
