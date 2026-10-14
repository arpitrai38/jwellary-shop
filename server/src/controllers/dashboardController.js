import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { Purchase } from '../models/Purchase.js';
import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { MetalRate } from '../models/MetalRate.js';
import { roundMoney, roundWeight } from '../utils/decimalUtil.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const endOfYesterday = new Date(startOfToday);
    endOfYesterday.setMilliseconds(-1);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Today's sales
    const todaySalesAgg = await Sale.aggregate([
      { $match: { invoiceDate: { $gte: startOfToday }, status: 'COMPLETED' } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, count: { $sum: 1 }, pendingCount: { $sum: { $cond: [{ $gt: ['$balanceDue', 0] }, 1, 0] } } } }
    ]);

    const todaySales = todaySalesAgg[0]?.totalRevenue || 0;
    const billsToday = todaySalesAgg[0]?.count || 0;
    const pendingBillsToday = todaySalesAgg[0]?.pendingCount || 0;

    // Yesterday's sales for delta comparison
    const yesterdaySalesAgg = await Sale.aggregate([
      { $match: { invoiceDate: { $gte: startOfYesterday, $lte: endOfYesterday }, status: 'COMPLETED' } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } }
    ]);
    const yesterdaySales = yesterdaySalesAgg[0]?.totalRevenue || 0;
    let salesDeltaPercent = 0;
    if (yesterdaySales > 0) {
      salesDeltaPercent = Number((((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(1));
    } else if (todaySales > 0) {
      salesDeltaPercent = 100;
    }

    // 2. Month sales
    const monthSalesAgg = await Sale.aggregate([
      { $match: { invoiceDate: { $gte: startOfMonth }, status: 'COMPLETED' } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
    ]);
    const monthSales = monthSalesAgg[0]?.totalRevenue || 0;

    // 3. Stock Pieces & Inventory Valuation
    const stockAgg = await Product.aggregate([
      { $match: { stockStatus: 'AVAILABLE' } },
      {
        $group: {
          _id: null,
          totalPieces: { $sum: 1 },
          totalGrossWeight: { $sum: '$grossWeight' },
          totalNetWeight: { $sum: '$netGoldWeight' },
          totalPurchaseCost: { $sum: '$purchaseCost' },
          totalSellingValuation: { $sum: '$sellingPriceEstimate' }
        }
      }
    ]);

    const stockPieces = stockAgg[0]?.totalPieces || 0;
    const stockGrossWeight = roundWeight(stockAgg[0]?.totalGrossWeight || 0);
    const stockNetWeight = roundWeight(stockAgg[0]?.totalNetWeight || 0);
    const stockCostValuation = roundMoney(stockAgg[0]?.totalPurchaseCost || 0);

    // Calculate live market valuation based on 22K rate if estimate is not set
    const rate22K = await MetalRate.findOne({ metal: 'GOLD', purity: '22K', isCurrent: true });
    const currentRatePerGram = rate22K?.ratePerGram || 6850;
    const liveGoldValuation = roundMoney(stockNetWeight * currentRatePerGram);
    const stockValuation = stockAgg[0]?.totalSellingValuation > 0 ? roundMoney(stockAgg[0].totalSellingValuation) : liveGoldValuation;

    // 4. Low stock detection (categories with 5 or fewer pieces)
    let lowStockCount = 0;
    if (stockPieces > 0) {
      const lowStockCategories = await Product.aggregate([
        { $match: { stockStatus: 'AVAILABLE' } },
        { $group: { _id: '$categoryName', count: { $sum: 1 } } },
        { $match: { count: { $lte: 5 } } }
      ]);
      lowStockCount = lowStockCategories.reduce((acc, c) => acc + c.count, 0);
    }

    // 5. Customer outstanding balance
    const custOutstandingAgg = await Customer.aggregate([
      { $match: { currentBalance: { $lt: 0 } } },
      { $group: { _id: null, total: { $sum: '$currentBalance' } } }
    ]);
    const customerOutstanding = Math.abs(custOutstandingAgg[0]?.total || 0);

    // 6. Supplier payable balance
    const suppPayableAgg = await Supplier.aggregate([
      { $match: { currentPayable: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$currentPayable' } } }
    ]);
    const supplierPayables = suppPayableAgg[0]?.total || 0;

    // 7. Recent business activity feed
    const recentSales = await Sale.find().sort({ createdAt: -1 }).limit(5);
    const recentMovements = await InventoryMovement.find().sort({ createdAt: -1 }).limit(5);

    const activities = [];

    recentSales.forEach((s) => {
      activities.push({
        id: `sale-${s._id}`,
        time: s.createdAt,
        activity: 'Sale completed',
        item: s.items[0] ? `${s.items[0].itemId} · ${s.items[0].name}` : `Bill #${s.invoiceNumber}`,
        amount: `₹${s.grandTotal.toLocaleString('en-IN')}`,
        status: 'SOLD',
        badgeColor: 'green'
      });
    });

    recentMovements.forEach((m) => {
      if (m.movementType === 'STOCK_IN') {
        activities.push({
          id: `move-${m._id}`,
          time: m.createdAt,
          activity: 'Stock received',
          item: `${m.itemId} (${m.netGoldWeight}g)`,
          amount: '—',
          status: 'ADDED',
          badgeColor: 'blue'
        });
      }
    });

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivities = activities.slice(0, 6);

    // 8. 7-day sales trend for dashboard charts
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const salesTrendAgg = await Sale.aggregate([
      { $match: { invoiceDate: { $gte: sevenDaysAgo }, status: 'COMPLETED' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$invoiceDate' } },
          totalSales: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        todaySales: roundMoney(todaySales),
        salesDeltaPercent,
        billsToday,
        pendingBillsToday,
        monthSales: roundMoney(monthSales),
        stockPieces,
        stockGrossWeight,
        stockNetWeight,
        stockCostValuation,
        stockValuation,
        lowStockCount,
        customerOutstanding: roundMoney(customerOutstanding),
        supplierPayables: roundMoney(supplierPayables),
        currentGoldRate22K: currentRatePerGram,
        recentActivities,
        salesTrend: salesTrendAgg
      }
    });
  } catch (error) {
    next(error);
  }
};
