import { Supplier } from '../models/Supplier.js';
import { Purchase } from '../models/Purchase.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Payment } from '../models/Payment.js';
import { Setting } from '../models/Setting.js';
import { roundMoney } from '../utils/decimalUtil.js';
import { logAudit } from '../utils/auditLogger.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { phone: reg }, { contactPerson: reg }, { gstin: reg }];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [suppliers, totalCount] = await Promise.all([
      Supplier.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitNum),
      Supplier.countDocuments(query)
    ]);

    // Metrics matching prototype Suppliers screen:
    // 1. Total suppliers count
    const totalSuppliers = await Supplier.countDocuments();

    // 2. Purchases this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthPurchasesAgg = await Purchase.aggregate([
      { $match: { purchaseDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const purchaseThisMonth = monthPurchasesAgg[0]?.total || 0;

    // 3. Pending payables across all suppliers
    const payablesAgg = await Supplier.aggregate([
      { $match: { currentPayable: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$currentPayable' } } }
    ]);
    const pendingPayables = payablesAgg[0]?.total || 0;

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      },
      metrics: {
        totalSuppliers,
        purchaseThisMonth: roundMoney(purchaseThisMonth),
        pendingPayables: roundMoney(pendingPayables)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, gstin, address, city, state, openingBalance = 0, notes } = req.body;

    const existing = await Supplier.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Supplier with phone ${phone} already exists (${existing.name})` });
    }

    const openBal = roundMoney(openingBalance);

    const supplier = await Supplier.create({
      name: name.trim(),
      contactPerson: contactPerson || '',
      phone: phone.trim(),
      email: (email || '').trim(),
      gstin: (gstin || '').toUpperCase().trim(),
      address: address || '',
      city: city || '',
      state: state || 'Rajasthan',
      openingBalance: openBal,
      currentPayable: openBal,
      notes: notes || ''
    });

    if (openBal > 0) {
      await LedgerEntry.create({
        partyType: 'SUPPLIER',
        partyId: supplier._id,
        entryDate: new Date(),
        entryType: 'CREDIT',
        amount: openBal,
        runningBalance: openBal,
        referenceType: 'OPENING_BALANCE',
        referenceNumber: 'OPN-PAYABLE',
        description: 'Opening Payable Balance Owed to Supplier',
        createdBy: req.user?._id
      });
    }

    await logAudit({
      req,
      action: 'SUPPLIER_CREATED',
      resource: 'Supplier',
      resourceId: supplier._id,
      details: { name: supplier.name, phone: supplier.phone }
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const getSupplierLedger = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const ledgerEntries = await LedgerEntry.find({
      partyType: 'SUPPLIER',
      partyId: supplier._id
    }).sort({ entryDate: 1, createdAt: 1 });

    res.json({
      success: true,
      supplier,
      data: ledgerEntries,
      summary: {
        openingBalance: supplier.openingBalance,
        totalPurchased: supplier.totalPurchased,
        totalPaid: supplier.totalPaid,
        currentPayable: supplier.currentPayable,
        status: supplier.currentPayable > 0 ? 'PENDING' : 'CLEAR'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const recordSupplierPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'BANK_TRANSFER', transactionRef = '', notes } = req.body;
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const payAmt = roundMoney(amount);
    if (payAmt <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    const setting = await Setting.findOneAndUpdate(
      { key: 'main_shop_config' },
      { $inc: { lastPaymentSeq: 1 } },
      { new: true, upsert: true }
    );
    const paymentNumber = `PAY-${String(setting.lastPaymentSeq || 1001).padStart(4, '0')}`;

    const prevPayable = supplier.currentPayable || 0;
    const newPayable = roundMoney(prevPayable - payAmt);

    const payment = await Payment.create({
      paymentNumber,
      paymentType: 'SUPPLIER_PAYMENT',
      partyType: 'SUPPLIER',
      supplier: supplier._id,
      amount: payAmt,
      paymentMethod,
      transactionRef,
      notes: notes || `Disbursed to supplier via ${paymentMethod}`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Staff'
    });

    await LedgerEntry.create({
      partyType: 'SUPPLIER',
      partyId: supplier._id,
      entryDate: new Date(),
      entryType: 'DEBIT',
      amount: payAmt,
      runningBalance: newPayable,
      referenceType: 'PAYMENT',
      referenceId: payment._id,
      referenceNumber: paymentNumber,
      description: `Payment disbursed via ${paymentMethod} (Ref: ${transactionRef || 'N/A'})`,
      createdBy: req.user?._id
    });

    supplier.currentPayable = newPayable;
    supplier.totalPaid = roundMoney((supplier.totalPaid || 0) + payAmt);
    await supplier.save();

    await logAudit({
      req,
      action: 'SUPPLIER_PAYMENT_DISBURSED',
      resource: 'Payment',
      resourceId: payment._id,
      details: { supplierName: supplier.name, amount: payAmt, remainingPayable: newPayable }
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmt} disbursed to ${supplier.name}. Remaining payable: ₹${newPayable}`,
      data: payment,
      remainingPayable: newPayable
    });
  } catch (error) {
    next(error);
  }
};
