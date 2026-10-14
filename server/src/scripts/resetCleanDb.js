import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { MetalRate } from '../models/MetalRate.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';
import { Setting } from '../models/Setting.js';
import { Sale } from '../models/Sale.js';
import { Purchase } from '../models/Purchase.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Payment } from '../models/Payment.js';
import { Expense } from '../models/Expense.js';
import { AuditLog } from '../models/AuditLog.js';

dotenv.config();

const resetClean = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aarna_jewar_db';
    await mongoose.connect(connUri);
    console.log('[Clean Reset] Connected to MongoDB');

    // Remove all demo transactions, products, customers, suppliers, and demo accounts
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Sale.deleteMany({}),
      Purchase.deleteMany({}),
      Customer.deleteMany({}),
      Supplier.deleteMany({}),
      InventoryMovement.deleteMany({}),
      LedgerEntry.deleteMany({}),
      Payment.deleteMany({}),
      Expense.deleteMany({}),
      AuditLog.deleteMany({}),
      Category.deleteMany({}),
      MetalRate.deleteMany({}),
      Setting.deleteMany({})
    ]);

    console.log('[Clean Reset] Completely wiped demo data: 0 products, 0 sales, 0 fake customers, 0 fake suppliers');

    // 1. Seed Clean Master Categories (Ready for use when adding items or importing stock)
    const standardCategories = [
      { name: 'Ring', code: 'RNG', defaultMakingChargeValue: 650 },
      { name: 'Bangle', code: 'BNG', defaultMakingChargeValue: 550 },
      { name: 'Jhumka', code: 'JHM', defaultMakingChargeValue: 750 },
      { name: 'Locket', code: 'LCK', defaultMakingChargeValue: 600 },
      { name: 'Tops', code: 'TPS', defaultMakingChargeValue: 550 },
      { name: 'Chain', code: 'CHN', defaultMakingChargeValue: 500 },
      { name: 'Necklace', code: 'NCK', defaultMakingChargeValue: 800 },
      { name: 'Mangalsutra', code: 'MNG', defaultMakingChargeValue: 650 },
      { name: 'Payal / Anklet', code: 'PYL', defaultMakingChargeValue: 500 },
      { name: 'Nosepin', code: 'NSP', defaultMakingChargeValue: 400 },
      { name: 'Gold Coin', code: 'CON', defaultMakingChargeValue: 200 }
    ];

    await Category.insertMany(standardCategories);
    console.log('[Clean Reset] Seeded 11 standard jewellery master categories');

    // 2. Initialize Standard Daily Gold Rates
    await MetalRate.insertMany([
      {
        metal: 'GOLD',
        purity: '24K',
        fineness: 999,
        ratePerGram: 7500,
        isCurrent: true,
        updatedByName: 'Store Owner',
        notes: 'Initial standard 24K rate'
      },
      {
        metal: 'GOLD',
        purity: '22K',
        fineness: 916,
        ratePerGram: 6900,
        isCurrent: true,
        updatedByName: 'Store Owner',
        notes: 'Initial standard 22K 916 Hallmark rate'
      },
      {
        metal: 'GOLD',
        purity: '18K',
        fineness: 750,
        ratePerGram: 5650,
        isCurrent: true,
        updatedByName: 'Store Owner',
        notes: 'Initial standard 18K Hallmark rate'
      },
      {
        metal: 'GOLD',
        purity: '14K',
        fineness: 585,
        ratePerGram: 4400,
        isCurrent: true,
        updatedByName: 'Store Owner',
        notes: 'Initial standard 14K rate'
      }
    ]);
    console.log('[Clean Reset] Seeded base gold rates (24K: ₹7500, 22K: ₹6900, 18K: ₹5650, 14K: ₹4400)');

    // 3. Initialize Shop Config with Clean Counter Starts
    await Setting.create({
      key: 'main_shop_config',
      shopName: 'My Jewellery Shop',
      tagline: 'Jewellery business command center',
      ownerName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      stateCode: '',
      gstin: '',
      cgstRate: 1.5,
      sgstRate: 1.5,
      igstRate: 3.0,
      hsnCode: '7113',
      lastInvoiceSeq: 1000,
      lastPurchaseSeq: 100,
      lastItemSeq: 100
    });

    console.log('[Clean Reset] Clean reset finished! The database is now 100% ready for real user registration.');
    process.exit(0);
  } catch (error) {
    console.error('[Clean Reset] Error:', error);
    process.exit(1);
  }
};

resetClean();
