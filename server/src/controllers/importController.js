import ExcelJS from 'exceljs';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { Setting } from '../models/Setting.js';
import { roundWeight, roundMoney } from '../utils/decimalUtil.js';
import { logAudit } from '../utils/auditLogger.js';

export const getImportTemplate = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Aarna Jewar ERP';
    const worksheet = workbook.addWorksheet('Inventory Template');

    worksheet.columns = [
      { header: 'Product Name*', key: 'name', width: 22 },
      { header: 'Category*', key: 'category', width: 16 },
      { header: 'Purity* (24K/22K/18K/14K)', key: 'purity', width: 24 },
      { header: 'Gross Weight (g)*', key: 'grossWeight', width: 18 },
      { header: 'Stone Weight (g)', key: 'stoneWeight', width: 16 },
      { header: 'Purchase Cost (₹)', key: 'purchaseCost', width: 18 },
      { header: 'Selling Price (₹)', key: 'sellingPrice', width: 18 },
      { header: 'HUID / Hallmark', key: 'huid', width: 18 },
      { header: 'Design / Model No', key: 'designNumber', width: 18 },
      { header: 'Counter Location', key: 'counterLocation', width: 18 }
    ];

    // Sample guidance rows
    worksheet.addRow({
      name: 'Gents Gold Ring',
      category: 'Ring',
      purity: '22K',
      grossWeight: 4.85,
      stoneWeight: 0.12,
      purchaseCost: 28500,
      sellingPrice: 35200,
      huid: 'AB1234',
      designNumber: 'RNG-09',
      counterLocation: 'Counter 1'
    });

    worksheet.addRow({
      name: 'Ladies Floral Bangle',
      category: 'Bangle',
      purity: '22K',
      grossWeight: 14.2,
      stoneWeight: 0,
      purchaseCost: 88000,
      sellingPrice: 104500,
      huid: 'BNG789',
      designNumber: 'BNG-02',
      counterLocation: 'Vault'
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Aarna_Jewar_Inventory_Import_Template.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate preview of imported rows
 */
export const previewImport = async (req, res, next) => {
  try {
    const { rows = [] } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided for import preview' });
    }

    const validPurities = ['24K', '22K', '18K', '14K'];
    const validRows = [];
    const errors = [];

    // Preload categories
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach((c) => {
      categoryMap[c.name.toLowerCase()] = c;
    });

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 1;
      const rowErrors = [];

      if (!r.name || String(r.name).trim() === '') {
        rowErrors.push('Product name is required');
      }

      const purity = String(r.purity || '22K').toUpperCase().trim();
      if (!validPurities.includes(purity)) {
        rowErrors.push(`Invalid purity: ${r.purity}. Allowed values are: 24K, 22K, 18K, 14K`);
      }

      const gross = parseFloat(r.grossWeight);
      if (isNaN(gross) || gross <= 0) {
        rowErrors.push('Gross weight must be a positive number');
      }

      const stone = parseFloat(r.stoneWeight || 0);
      if (isNaN(stone) || stone < 0) {
        rowErrors.push('Stone weight must be zero or positive');
      }

      if (gross && stone && stone > gross) {
        rowErrors.push('Stone weight cannot be greater than gross weight');
      }

      const catName = String(r.category || 'Ring').trim();

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNum,
          item: r.name || `Row #${rowNum}`,
          errors: rowErrors
        });
      } else {
        const netGold = roundWeight(gross - stone);
        validRows.push({
          name: String(r.name).trim(),
          categoryName: catName,
          purity,
          grossWeight: roundWeight(gross),
          stoneWeight: roundWeight(stone),
          netGoldWeight: netGold,
          purchaseCost: roundMoney(r.purchaseCost || 0),
          sellingPrice: roundMoney(r.sellingPrice || (gross * 7000)),
          huid: String(r.huid || '').trim().toUpperCase(),
          designNumber: String(r.designNumber || '').trim(),
          counterLocation: String(r.counterLocation || 'Counter 1').trim()
        });
      }
    }

    res.json({
      success: true,
      totalRows: rows.length,
      validCount: validRows.length,
      errorCount: errors.length,
      validRows,
      errors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm and commit validated rows into inventory
 */
export const confirmImport = async (req, res, next) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No validated items to import' });
    }

    // Preload categories
    const categories = await Category.find();
    const categoryMap = {};
    categories.forEach((c) => {
      categoryMap[c.name.toLowerCase()] = c;
    });

    let defaultCat = categories[0];
    if (!defaultCat) {
      defaultCat = await Category.create({ name: 'General Jewellery', code: 'GEN' });
    }

    const createdItems = [];

    for (const item of items) {
      const setting = await Setting.findOneAndUpdate(
        { key: 'main_shop_config' },
        { $inc: { lastItemSeq: 1 } },
        { new: true, upsert: true }
      );

      const seq = setting.lastItemSeq;
      const itemId = `JWL-${String(seq).padStart(5, '0')}`;
      const barcode = `JWL${String(seq).padStart(5, '0')}`;

      let catObj = categoryMap[String(item.categoryName || '').toLowerCase()];
      if (!catObj) {
        catObj = await Category.create({
          name: item.categoryName || 'General',
          code: String(item.categoryName || 'GEN').substring(0, 3).toUpperCase()
        });
        categoryMap[catObj.name.toLowerCase()] = catObj;
      }

      const gross = roundWeight(item.grossWeight);
      const stone = roundWeight(item.stoneWeight || 0);
      const netGold = roundWeight(gross - stone);

      const product = await Product.create({
        itemId,
        barcode,
        name: item.name,
        category: catObj._id,
        categoryName: catObj.name,
        designNumber: item.designNumber || '',
        purity: item.purity || '22K',
        grossWeight: gross,
        stoneWeight: stone,
        netGoldWeight: netGold,
        huid: (item.huid || '').toUpperCase(),
        pricingType: 'WEIGHT_BASED',
        fixedSellingPrice: roundMoney(item.sellingPrice || 0),
        makingChargeType: 'PER_GRAM',
        makingChargeValue: catObj.defaultMakingChargeValue || 650,
        purchaseCost: roundMoney(item.purchaseCost || 0),
        sellingPriceEstimate: roundMoney(item.sellingPrice || (gross * 7000)),
        tagStatus: 'PENDING',
        stockStatus: 'AVAILABLE',
        counterLocation: item.counterLocation || 'Counter 1'
      });

      await InventoryMovement.create({
        product: product._id,
        itemId: product.itemId,
        barcode: product.barcode,
        movementType: 'STOCK_IN',
        grossWeight: product.grossWeight,
        netGoldWeight: product.netGoldWeight,
        referenceType: 'MANUAL',
        reason: 'Excel Opening Inventory Import',
        performedBy: req.user?._id,
        performedByName: req.user?.name || 'Staff'
      });

      createdItems.push(product);
    }

    await logAudit({
      req,
      action: 'EXCEL_INVENTORY_IMPORTED',
      resource: 'Product',
      details: { importedCount: createdItems.length }
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdItems.length} jewellery pieces with unique Item IDs and barcodes into inventory!`,
      importedCount: createdItems.length
    });
  } catch (error) {
    next(error);
  }
};
