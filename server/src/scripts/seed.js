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
import { InventoryMovement } from '../models/InventoryMovement.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Payment } from '../models/Payment.js';

dotenv.config();

const seed = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aarna_jewar_db';
    await mongoose.connect(connUri);
    console.log('[Seed] Connected to MongoDB');

    // Clear existing data cleanly for fresh initial state
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      MetalRate.deleteMany(),
      Product.deleteMany(),
      Customer.deleteMany(),
      Supplier.deleteMany(),
      Setting.deleteMany(),
      Sale.deleteMany(),
      InventoryMovement.deleteMany(),
      LedgerEntry.deleteMany(),
      Payment.deleteMany()
    ]);

    console.log('[Seed] Cleared old collections');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Ranjeet Soni',
      username: 'admin',
      email: 'owner@aarnajewar.com',
      password: 'admin123',
      role: 'OWNER',
      permissions: ['ALL'],
      isActive: true
    });

    const managerUser = await User.create({
      name: 'Sunil Verma',
      username: 'manager',
      email: 'manager@aarnajewar.com',
      password: 'manager123',
      role: 'MANAGER',
      permissions: ['INVENTORY', 'BILLING', 'PURCHASES', 'CUSTOMERS', 'REPORTS'],
      isActive: true
    });

    const cashierUser = await User.create({
      name: 'Vikas Sharma',
      username: 'cashier',
      email: 'cashier@aarnajewar.com',
      password: 'cashier123',
      role: 'CASHIER',
      permissions: ['BILLING', 'CUSTOMERS'],
      isActive: true
    });

    const stockUser = await User.create({
      name: 'Deepak Soni',
      username: 'stock',
      email: 'stock@aarnajewar.com',
      password: 'stock123',
      role: 'STOCK_STAFF',
      permissions: ['INVENTORY', 'TAGGING', 'PURCHASES'],
      isActive: true
    });

    console.log('[Seed] Created default users: admin, manager, cashier, stock (passwords: <username>123)');

    // 2. Create Categories
    const categoriesData = [
      { name: 'Ring', code: 'RNG', defaultMakingChargeValue: 650, defaultWastagePercent: 0 },
      { name: 'Bangle', code: 'BNG', defaultMakingChargeValue: 550, defaultWastagePercent: 0 },
      { name: 'Jhumka', code: 'JHM', defaultMakingChargeValue: 750, defaultWastagePercent: 0 },
      { name: 'Locket', code: 'LCK', defaultMakingChargeValue: 600, defaultWastagePercent: 0 },
      { name: 'Tops', code: 'TPS', defaultMakingChargeValue: 550, defaultWastagePercent: 0 },
      { name: 'Chain', code: 'CHN', defaultMakingChargeValue: 500, defaultWastagePercent: 0 },
      { name: 'Necklace', code: 'NCK', defaultMakingChargeValue: 800, defaultWastagePercent: 0 }
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const created = await Category.create(cat);
      categoryMap[cat.name] = created;
    }
    console.log('[Seed] Created categories');

    // 3. Create Metal Rates
    await MetalRate.create([
      {
        metal: 'GOLD',
        purity: '24K',
        fineness: 999,
        ratePerGram: 7450,
        isCurrent: true,
        updatedBy: adminUser._id,
        updatedByName: adminUser.name,
        notes: 'Official morning standard 24K rate'
      },
      {
        metal: 'GOLD',
        purity: '22K',
        fineness: 916,
        ratePerGram: 6850,
        isCurrent: true,
        updatedBy: adminUser._id,
        updatedByName: adminUser.name,
        notes: 'Standard 916 hallmark selling rate'
      },
      {
        metal: 'GOLD',
        purity: '18K',
        fineness: 750,
        ratePerGram: 5600,
        isCurrent: true,
        updatedBy: adminUser._id,
        updatedByName: adminUser.name,
        notes: 'Standard 750 hallmark rate'
      },
      {
        metal: 'GOLD',
        purity: '14K',
        fineness: 585,
        ratePerGram: 4350,
        isCurrent: true,
        updatedBy: adminUser._id,
        updatedByName: adminUser.name,
        notes: 'Standard 585 hallmark rate'
      }
    ]);
    console.log('[Seed] Created manual gold rates (24K: ₹7,450, 22K: ₹6,850, 18K: ₹5,600, 14K: ₹4,350)');

    // 4. Create Settings
    await Setting.create({
      key: 'main_shop_config',
      shopName: 'AARNA JEWAR',
      tagline: 'Jewellery business command center',
      ownerName: 'Ranjeet Soni',
      phone: '+91 98290 12345',
      email: 'contact@aarnajewar.com',
      address: 'Shop No. 12, Main Sarafa Bazar',
      city: 'Jaipur',
      state: 'Rajasthan',
      stateCode: '08',
      pincode: '302001',
      gstin: '08AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      cgstRate: 1.5,
      sgstRate: 1.5,
      igstRate: 3.0,
      hsnCode: '7113',
      lastInvoiceSeq: 1024,
      lastPurchaseSeq: 100,
      lastItemSeq: 127
    });
    console.log('[Seed] Initialized shop configuration');

    // 5. Create Suppliers
    const supplier1 = await Supplier.create({
      name: 'ABC Jewellery',
      contactPerson: 'Kailash Soni',
      phone: '9829011111',
      email: 'abc@jewellery.com',
      gstin: '08ABCDE1234F1Z1',
      address: 'Johari Bazar',
      city: 'Jaipur',
      state: 'Rajasthan',
      openingBalance: 18000,
      currentPayable: 18000,
      totalPurchased: 128000,
      totalPaid: 110000,
      lastPurchaseDate: new Date('2026-10-11')
    });

    const supplier2 = await Supplier.create({
      name: 'Shree Designs',
      contactPerson: 'Mahesh Sharma',
      phone: '9829022222',
      email: 'shree@designs.com',
      gstin: '08XYZAB5678C1Z2',
      address: 'Sarafa Chowk',
      city: 'Jaipur',
      state: 'Rajasthan',
      openingBalance: 0,
      currentPayable: 0,
      totalPurchased: 92500,
      totalPaid: 92500,
      lastPurchaseDate: new Date('2026-10-08')
    });
    console.log('[Seed] Created suppliers: ABC Jewellery (Payable ₹18,000), Shree Designs (Clear)');

    // 6. Create Customers
    const customer1 = await Customer.create({
      name: 'Rahul Sharma',
      phone: '9829033333',
      email: 'rahul@example.com',
      address: 'Bapu Nagar',
      city: 'Jaipur',
      state: 'Rajasthan',
      totalPurchases: 28450,
      totalBillsCount: 14,
      currentBalance: 0,
      customerType: 'REPEAT',
      lastPurchaseDate: new Date('2026-10-08')
    });

    const customer2 = await Customer.create({
      name: 'Neha Gupta',
      phone: '9829044444',
      email: 'neha@example.com',
      address: 'Malviya Nagar',
      city: 'Jaipur',
      state: 'Rajasthan',
      totalPurchases: 18600,
      totalBillsCount: 8,
      currentBalance: -8400, // owes 8400
      customerType: 'REPEAT',
      lastPurchaseDate: new Date('2026-10-05')
    });

    const customer3 = await Customer.create({
      name: 'Pooja Agarwal',
      phone: '9829055555',
      address: 'Vaishali Nagar',
      city: 'Jaipur',
      state: 'Rajasthan',
      totalPurchases: 45000,
      totalBillsCount: 3,
      currentBalance: -10000, // owes 10000 -> total outstanding = 18400!
      customerType: 'REGULAR'
    });
    console.log('[Seed] Created customers: Rahul Sharma, Neha Gupta, Pooja Agarwal (Total Outstanding: ₹18,400)');

    // 7. Create Products matching prototype
    const specificItems = [
      {
        itemId: 'JWL-00124',
        barcode: 'JWL00124',
        name: 'Locket',
        category: categoryMap['Locket']._id,
        categoryName: 'Locket',
        purity: '22K',
        grossWeight: 1.45,
        stoneWeight: 0,
        netGoldWeight: 1.45,
        purchaseCost: 7000,
        fixedSellingPrice: 10700,
        sellingPriceEstimate: 10700,
        tagStatus: 'VERIFIED',
        stockStatus: 'AVAILABLE',
        huid: 'LK9124',
        supplier: supplier1._id,
        supplierName: supplier1.name
      },
      {
        itemId: 'JWL-00125',
        barcode: 'JWL00125',
        name: 'Tops',
        category: categoryMap['Tops']._id,
        categoryName: 'Tops',
        purity: '22K',
        grossWeight: 1.35,
        stoneWeight: 0,
        netGoldWeight: 1.35,
        purchaseCost: 6600,
        fixedSellingPrice: 10100,
        sellingPriceEstimate: 10100,
        tagStatus: 'VERIFIED',
        stockStatus: 'AVAILABLE',
        huid: 'TP9125',
        supplier: supplier1._id,
        supplierName: supplier1.name
      },
      {
        itemId: 'JWL-00126',
        barcode: 'JWL00126',
        name: 'Gents Ring',
        category: categoryMap['Ring']._id,
        categoryName: 'Ring',
        purity: '22K',
        grossWeight: 1.55,
        stoneWeight: 0,
        netGoldWeight: 1.55,
        purchaseCost: 7200,
        fixedSellingPrice: 11100,
        sellingPriceEstimate: 11100,
        tagStatus: 'PENDING',
        stockStatus: 'AVAILABLE',
        huid: 'RN9126',
        supplier: supplier1._id,
        supplierName: supplier1.name
      },
      {
        itemId: 'JWL-00127',
        barcode: 'JWL00127',
        name: 'Jhumki',
        category: categoryMap['Jhumka']._id,
        categoryName: 'Jhumka',
        purity: '22K',
        grossWeight: 1.45,
        stoneWeight: 0,
        netGoldWeight: 1.45,
        purchaseCost: 7000,
        fixedSellingPrice: 10700,
        sellingPriceEstimate: 10700,
        tagStatus: 'VERIFIED',
        stockStatus: 'AVAILABLE',
        huid: 'JH9127',
        supplier: supplier2._id,
        supplierName: supplier2.name
      }
    ];

    for (const item of specificItems) {
      const prod = await Product.create(item);
      await InventoryMovement.create({
        product: prod._id,
        itemId: prod.itemId,
        barcode: prod.barcode,
        movementType: 'STOCK_IN',
        grossWeight: prod.grossWeight,
        netGoldWeight: prod.netGoldWeight,
        reason: 'Opening stock item',
        performedByName: 'Admin'
      });
    }

    // Create 39 additional Rings (total 40 Rings)
    for (let i = 1; i <= 39; i++) {
      const seq = 1000 + i;
      const itemId = `JWL-R${seq}`;
      const barcode = `JWLR${seq}`;
      await Product.create({
        itemId,
        barcode,
        name: `Gold Ring #${i}`,
        category: categoryMap['Ring']._id,
        categoryName: 'Ring',
        purity: '22K',
        grossWeight: 2.2,
        stoneWeight: 0,
        netGoldWeight: 2.2,
        purchaseCost: 11500,
        fixedSellingPrice: 16500,
        sellingPriceEstimate: 16500,
        tagStatus: 'VERIFIED',
        stockStatus: 'AVAILABLE',
        huid: `RG${seq}`
      });
    }

    // Create 60 Bangles (total 60 Bangles)
    for (let i = 1; i <= 60; i++) {
      const seq = 2000 + i;
      const itemId = `JWL-B${seq}`;
      const barcode = `JWLB${seq}`;
      await Product.create({
        itemId,
        barcode,
        name: `Gold Bangle #${i}`,
        category: categoryMap['Bangle']._id,
        categoryName: 'Bangle',
        purity: '22K',
        grossWeight: 12.5,
        stoneWeight: 0,
        netGoldWeight: 12.5,
        purchaseCost: 65000,
        fixedSellingPrice: 92000,
        sellingPriceEstimate: 92000,
        tagStatus: 'VERIFIED',
        stockStatus: 'AVAILABLE',
        huid: `BG${seq}`
      });
    }

    // Create 99 additional Jhumkas (total 100 Jhumkas)
    for (let i = 1; i <= 99; i++) {
      const seq = 3000 + i;
      const itemId = `JWL-J${seq}`;
      const barcode = `JWLJ${seq}`;
      await Product.create({
        itemId,
        barcode,
        name: `Gold Jhumka #${i}`,
        category: categoryMap['Jhumka']._id,
        categoryName: 'Jhumka',
        purity: '22K',
        grossWeight: 3.8,
        stoneWeight: 0,
        netGoldWeight: 3.8,
        purchaseCost: 20000,
        fixedSellingPrice: 28500,
        sellingPriceEstimate: 28500,
        tagStatus: i <= 93 ? 'VERIFIED' : 'PENDING',
        stockStatus: 'AVAILABLE',
        huid: `JH${seq}`
      });
    }

    console.log('[Seed] Created inventory items: 40 Rings, 60 Bangles, 100 Jhumkas (Matching prototype quantities)');

    // 8. Create today's sample sales matching prototype: Today Sales ₹48,250, Bills 17
    const today = new Date();
    await Sale.create({
      invoiceNumber: 'INV-1024',
      invoiceDate: today,
      customer: customer1._id,
      customerSnapshot: {
        name: customer1.name,
        phone: customer1.phone,
        city: customer1.city,
        state: customer1.state
      },
      items: [
        {
          itemId: 'JWL-00124',
          barcode: 'JWL00124',
          name: 'Locket',
          purity: '22K',
          grossWeight: 1.45,
          stoneWeight: 0,
          netGoldWeight: 1.45,
          goldRatePerGram: 6850,
          metalValue: 9932.5,
          makingCharge: 767.5,
          unitPrice: 10700,
          quantity: 1,
          lineTotal: 10700
        }
      ],
      totalPieces: 1,
      totalGrossWeight: 1.45,
      totalNetWeight: 1.45,
      subtotal: 10700,
      discount: 0,
      taxableAmount: 10700,
      cgstRate: 1.5,
      cgstAmount: 160.5,
      sgstRate: 1.5,
      sgstAmount: 160.5,
      totalTax: 321,
      roundOff: 0,
      grandTotal: 11021,
      paidAmount: 11021,
      balanceDue: 0,
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      cashier: cashierUser._id,
      cashierName: cashierUser.name
    });

    console.log('[Seed] Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

seed();
