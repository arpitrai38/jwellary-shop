import { Customer } from '../models/Customer.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Payment } from '../models/Payment.js';
import { Setting } from '../models/Setting.js';
import { roundMoney } from '../utils/decimalUtil.js';
import { logAudit } from '../utils/auditLogger.js';

export const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [{ name: reg }, { phone: reg }, { city: reg }];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [customers, totalCount] = await Promise.all([
      Customer.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitNum),
      Customer.countDocuments(query)
    ]);

    // Top metrics for Customers screen matching prototype
    const totalCustomers = await Customer.countDocuments();
    const repeatCustomers = await Customer.countDocuments({ totalBillsCount: { $gt: 1 } });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const newToday = await Customer.countDocuments({ createdAt: { $gte: startOfToday } });

    // Outstanding dues across all credit customers (negative balance means customer owes shop)
    const outstandingAgg = await Customer.aggregate([
      { $match: { currentBalance: { $lt: 0 } } },
      { $group: { _id: null, total: { $sum: '$currentBalance' } } }
    ]);
    const totalOutstanding = Math.abs(outstandingAgg[0]?.total || 0);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      },
      metrics: {
        totalCustomers,
        repeatCustomers,
        newToday,
        totalOutstanding: roundMoney(totalOutstanding)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, city, state, stateCode, pan, aadhaar, openingBalance = 0, notes } = req.body;

    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Customer with phone ${phone} already exists (${existing.name})` });
    }

    const openBal = roundMoney(openingBalance);

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      address: address || '',
      city: city || '',
      state: state || 'Rajasthan',
      stateCode: stateCode || '08',
      pan: (pan || '').toUpperCase().trim(),
      aadhaar: (aadhaar || '').trim(),
      openingBalance: openBal,
      currentBalance: openBal,
      notes: notes || ''
    });

    if (openBal !== 0) {
      await LedgerEntry.create({
        partyType: 'CUSTOMER',
        partyId: customer._id,
        entryDate: new Date(),
        entryType: openBal > 0 ? 'CREDIT' : 'DEBIT',
        amount: Math.abs(openBal),
        runningBalance: openBal,
        referenceType: 'OPENING_BALANCE',
        referenceNumber: 'OPN-BAL',
        description: openBal > 0 ? 'Opening Advance Credit Balance' : 'Opening Outstanding Due Balance',
        createdBy: req.user?._id
      });
    }

    await logAudit({
      req,
      action: 'CUSTOMER_CREATED',
      resource: 'Customer',
      resourceId: customer._id,
      details: { name: customer.name, phone: customer.phone, openingBalance: openBal }
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

export const getCustomerLedger = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const ledgerEntries = await LedgerEntry.find({
      partyType: 'CUSTOMER',
      partyId: customer._id
    }).sort({ entryDate: 1, createdAt: 1 });

    let totalDebits = 0;
    let totalCredits = 0;
    ledgerEntries.forEach((e) => {
      if (e.entryType === 'DEBIT') totalDebits += e.amount;
      if (e.entryType === 'CREDIT') totalCredits += e.amount;
    });

    res.json({
      success: true,
      customer,
      data: ledgerEntries,
      summary: {
        openingBalance: customer.openingBalance,
        totalDebits: roundMoney(totalDebits),
        totalCredits: roundMoney(totalCredits),
        closingBalance: customer.currentBalance,
        outstandingStatus: customer.currentBalance < 0 ? 'DUE_FROM_CUSTOMER' : customer.currentBalance > 0 ? 'CUSTOMER_ADVANCE' : 'CLEAR'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const recordCustomerPayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'CASH', transactionRef = '', paymentType = 'CUSTOMER_DUE_PAYMENT', notes } = req.body;
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
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
    const paymentNumber = `REC-${String(setting.lastPaymentSeq || 1001).padStart(4, '0')}`;

    const prevBal = customer.currentBalance || 0;
    const newBal = roundMoney(prevBal + payAmt); // paying reduces outstanding (moves closer to positive)

    const payment = await Payment.create({
      paymentNumber,
      paymentType,
      partyType: 'CUSTOMER',
      customer: customer._id,
      amount: payAmt,
      paymentMethod,
      transactionRef,
      notes: notes || `Customer payment received via ${paymentMethod}`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Cashier'
    });

    await LedgerEntry.create({
      partyType: 'CUSTOMER',
      partyId: customer._id,
      entryDate: new Date(),
      entryType: 'CREDIT',
      amount: payAmt,
      runningBalance: newBal,
      referenceType: 'PAYMENT',
      referenceId: payment._id,
      referenceNumber: paymentNumber,
      description: `Payment received via ${paymentMethod} (Ref: ${transactionRef || 'N/A'})`,
      createdBy: req.user?._id
    });

    customer.currentBalance = newBal;
    await customer.save();

    await logAudit({
      req,
      action: 'CUSTOMER_PAYMENT_RECORDED',
      resource: 'Payment',
      resourceId: payment._id,
      details: { customerName: customer.name, amount: payAmt, newBalance: newBal }
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmt} recorded successfully. New balance: ₹${newBal}`,
      data: payment,
      newBalance: newBal
    });
  } catch (error) {
    next(error);
  }
};
