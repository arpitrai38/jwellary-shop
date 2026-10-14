import ExcelJS from 'exceljs';
import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { Purchase } from '../models/Purchase.js';
import { Expense } from '../models/Expense.js';
import { Customer } from '../models/Customer.js';
import { Supplier } from '../models/Supplier.js';
import { roundMoney, roundWeight } from '../utils/decimalUtil.js';

export const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { status: 'COMPLETED' };

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    const sales = await Sale.find(query).sort({ invoiceDate: -1 });

    let totalRevenue = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalPieces = 0;
    let totalGoldWeight = 0;

    sales.forEach((s) => {
      totalRevenue += s.grandTotal;
      totalTax += s.totalTax;
      totalDiscount += s.discount;
      totalPieces += s.totalPieces || s.items.length;
      totalGoldWeight += s.totalNetWeight || 0;
    });

    res.json({
      success: true,
      data: sales,
      summary: {
        invoiceCount: sales.length,
        totalRevenue: roundMoney(totalRevenue),
        totalTax: roundMoney(totalTax),
        totalDiscount: roundMoney(totalDiscount),
        totalPieces,
        totalGoldWeight: roundWeight(totalGoldWeight)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getStockReport = async (req, res, next) => {
  try {
    const { category, status = 'AVAILABLE' } = req.query;
    const match = {};
    if (status && status !== 'ALL') match.stockStatus = status;
    if (category && category !== 'ALL') match.categoryName = category;

    const products = await Product.find(match).sort({ createdAt: -1 });

    const summaryByPurity = await Product.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$purity',
          count: { $sum: 1 },
          grossWeight: { $sum: '$grossWeight' },
          netGoldWeight: { $sum: '$netGoldWeight' },
          costValuation: { $sum: '$purchaseCost' },
          sellingValuation: { $sum: '$sellingPriceEstimate' }
        }
      }
    ]);

    const summaryByCategory = await Product.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$categoryName',
          count: { $sum: 1 },
          netGoldWeight: { $sum: '$netGoldWeight' },
          sellingValuation: { $sum: '$sellingPriceEstimate' }
        }
      }
    ]);

    res.json({
      success: true,
      data: products,
      summaryByPurity,
      summaryByCategory
    });
  } catch (error) {
    next(error);
  }
};

export const getProfitReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }

    const saleFilter = { status: 'COMPLETED' };
    const expenseFilter = {};
    if (startDate || endDate) {
      saleFilter.invoiceDate = dateQuery;
      expenseFilter.expenseDate = dateQuery;
    }

    const [sales, expenses] = await Promise.all([
      Sale.find(saleFilter).populate('items.product'),
      Expense.find(expenseFilter)
    ]);

    let totalRevenue = 0;
    let totalCogs = 0; // Cost of goods sold based on purchase cost

    sales.forEach((s) => {
      totalRevenue += s.taxableAmount; // Profit is derived from taxable sales (pre-GST)
      s.items.forEach((item) => {
        const prodCost = item.product?.purchaseCost || item.purchaseCost || item.lineTotal * 0.75;
        totalCogs += prodCost;
      });
    });

    const grossProfit = roundMoney(totalRevenue - totalCogs);
    const grossMarginPercent = totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0;

    let totalExpenses = 0;
    expenses.forEach((e) => {
      totalExpenses += e.amount;
    });

    const netProfit = roundMoney(grossProfit - totalExpenses);

    res.json({
      success: true,
      summary: {
        totalRevenue: roundMoney(totalRevenue),
        totalCostOfGoods: roundMoney(totalCogs),
        grossProfit,
        grossMarginPercent,
        totalShopExpenses: roundMoney(totalExpenses),
        netProfit
      },
      expenses
    });
  } catch (error) {
    next(error);
  }
};

export const getGstReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { status: 'COMPLETED' };
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    const sales = await Sale.find(query).sort({ invoiceDate: -1 });

    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalTax = 0;

    sales.forEach((s) => {
      totalTaxable += s.taxableAmount;
      totalCGST += s.cgstAmount;
      totalSGST += s.sgstAmount;
      totalIGST += s.igstAmount;
      totalTax += s.totalTax;
    });

    res.json({
      success: true,
      summary: {
        invoiceCount: sales.length,
        hsnCode: '7113',
        totalTaxable: roundMoney(totalTaxable),
        totalCGST: roundMoney(totalCGST),
        totalSGST: roundMoney(totalSGST),
        totalIGST: roundMoney(totalIGST),
        totalTax: roundMoney(totalTax)
      },
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

export const exportReportExcel = async (req, res, next) => {
  try {
    const { type = 'sales' } = req.query;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Aarna Jewar ERP';
    workbook.created = new Date();

    if (type === 'sales') {
      const worksheet = workbook.addWorksheet('Sales Register');
      worksheet.columns = [
        { header: 'Invoice No', key: 'invoiceNumber', width: 16 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Customer', key: 'customer', width: 22 },
        { header: 'Items', key: 'items', width: 10 },
        { header: 'Net Gold Wt (g)', key: 'netWeight', width: 16 },
        { header: 'Subtotal (₹)', key: 'subtotal', width: 14 },
        { header: 'Discount (₹)', key: 'discount', width: 14 },
        { header: 'Taxable (₹)', key: 'taxable', width: 14 },
        { header: 'GST (₹)', key: 'gst', width: 12 },
        { header: 'Grand Total (₹)', key: 'total', width: 16 },
        { header: 'Payment Status', key: 'status', width: 14 }
      ];

      const sales = await Sale.find({ status: 'COMPLETED' }).sort({ invoiceDate: -1 });
      sales.forEach((s) => {
        worksheet.addRow({
          invoiceNumber: s.invoiceNumber,
          date: s.invoiceDate.toISOString().split('T')[0],
          customer: s.customerSnapshot?.name || 'Walk-in Customer',
          items: s.totalPieces,
          netWeight: s.totalNetWeight,
          subtotal: s.subtotal,
          discount: s.discount,
          taxable: s.taxableAmount,
          gst: s.totalTax,
          total: s.grandTotal,
          status: s.paymentStatus
        });
      });
    } else {
      const worksheet = workbook.addWorksheet('Stock Inventory');
      worksheet.columns = [
        { header: 'Item ID', key: 'itemId', width: 14 },
        { header: 'Barcode', key: 'barcode', width: 14 },
        { header: 'Product Name', key: 'name', width: 24 },
        { header: 'Category', key: 'category', width: 14 },
        { header: 'Purity', key: 'purity', width: 10 },
        { header: 'Gross Wt (g)', key: 'gross', width: 14 },
        { header: 'Stone Wt (g)', key: 'stone', width: 14 },
        { header: 'Net Gold Wt (g)', key: 'net', width: 16 },
        { header: 'Cost (₹)', key: 'cost', width: 12 },
        { header: 'Selling (₹)', key: 'selling', width: 12 },
        { header: 'Tag Status', key: 'tagStatus', width: 14 },
        { header: 'Stock Status', key: 'stockStatus', width: 14 }
      ];

      const products = await Product.find().sort({ createdAt: -1 });
      products.forEach((p) => {
        worksheet.addRow({
          itemId: p.itemId,
          barcode: p.barcode,
          name: p.name,
          category: p.categoryName,
          purity: p.purity,
          gross: p.grossWeight,
          stone: p.stoneWeight,
          net: p.netGoldWeight,
          cost: p.purchaseCost,
          selling: p.fixedSellingPrice,
          tagStatus: p.tagStatus,
          stockStatus: p.stockStatus
        });
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Aarna_Jewar_${type}_report.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
