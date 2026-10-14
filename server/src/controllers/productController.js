import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { Setting } from '../models/Setting.js';
import { roundWeight, roundMoney } from '../utils/decimalUtil.js';
import { logAudit } from '../utils/auditLogger.js';

export const getProducts = async (req, res, next) => {
  try {
    const { search, category, stockStatus, tagStatus, page = 1, limit = 50 } = req.query;

    const query = {};

    if (stockStatus && stockStatus !== 'ALL') {
      query.stockStatus = stockStatus;
    }

    if (tagStatus && tagStatus !== 'ALL') {
      query.tagStatus = tagStatus;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search) {
      const reg = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: reg },
        { itemId: reg },
        { barcode: reg },
        { categoryName: reg },
        { designNumber: reg },
        { huid: reg }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [products, totalCount] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('category', 'name code'),
      Product.countDocuments(query)
    ]);

    // Grouping summaries for category cards (Rings, Bangles, Jhumkas, etc.)
    const categoryCounts = await Product.aggregate([
      { $match: { stockStatus: 'AVAILABLE' } },
      { $group: { _id: '$categoryName', count: { $sum: 1 }, totalWeight: { $sum: '$netGoldWeight' } } }
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      },
      categoryCounts
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category').populate('supplier');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const getProductByBarcode = async (req, res, next) => {
  try {
    const rawCode = (req.params.barcode || '').trim().toUpperCase();
    if (!rawCode) {
      return res.status(400).json({ success: false, message: 'Barcode is required' });
    }

    // Try finding by exact barcode or itemId
    const product = await Product.findOne({
      $or: [{ barcode: rawCode }, { itemId: rawCode }]
    }).populate('category');

    if (!product) {
      return res.status(404).json({ success: false, message: `No jewellery item found for code: ${rawCode}` });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      category,
      designNumber,
      purity,
      grossWeight,
      stoneWeight = 0,
      huid,
      pricingType = 'WEIGHT_BASED',
      fixedSellingPrice = 0,
      makingChargeType = 'PER_GRAM',
      makingChargeValue = 0,
      wastagePercent = 0,
      purchaseCost = 0,
      sellingPriceEstimate = 0,
      counterLocation = 'Counter 1',
      supplier,
      supplierName
    } = req.body;

    // Fetch category name
    let categoryName = '';
    if (category) {
      const cat = await Category.findById(category);
      if (cat) categoryName = cat.name;
    }

    // Generate next unique Item ID and Barcode safely
    const setting = await Setting.findOneAndUpdate(
      { key: 'main_shop_config' },
      { $inc: { lastItemSeq: 1 } },
      { new: true, upsert: true }
    );

    const seqNumber = setting.lastItemSeq;
    const itemId = `JWL-${String(seqNumber).padStart(5, '0')}`;
    const barcode = `JWL${String(seqNumber).padStart(5, '0')}`;

    const gross = roundWeight(grossWeight);
    const stone = roundWeight(stoneWeight);
    const netGold = roundWeight(gross - stone);

    const product = await Product.create({
      itemId,
      barcode,
      name,
      category,
      categoryName,
      designNumber: designNumber || '',
      purity: purity || '22K',
      grossWeight: gross,
      stoneWeight: stone,
      netGoldWeight: netGold,
      huid: (huid || '').toUpperCase(),
      pricingType,
      fixedSellingPrice: roundMoney(fixedSellingPrice),
      makingChargeType,
      makingChargeValue: roundMoney(makingChargeValue),
      wastagePercent: Number(wastagePercent) || 0,
      purchaseCost: roundMoney(purchaseCost),
      sellingPriceEstimate: roundMoney(sellingPriceEstimate || fixedSellingPrice),
      counterLocation,
      supplier: supplier || null,
      supplierName: supplierName || '',
      tagStatus: 'PENDING',
      stockStatus: 'AVAILABLE'
    });

    // Record initial stock-in movement
    await InventoryMovement.create({
      product: product._id,
      itemId: product.itemId,
      barcode: product.barcode,
      movementType: 'STOCK_IN',
      grossWeight: product.grossWeight,
      netGoldWeight: product.netGoldWeight,
      referenceType: 'MANUAL',
      reason: 'Opening stock / individual item entry',
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Staff'
    });

    await logAudit({
      req,
      action: 'PRODUCT_CREATED',
      resource: 'Product',
      resourceId: product._id,
      details: { itemId: product.itemId, name: product.name, netGoldWeight: product.netGoldWeight }
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      category,
      designNumber,
      purity,
      grossWeight,
      stoneWeight,
      huid,
      pricingType,
      fixedSellingPrice,
      makingChargeType,
      makingChargeValue,
      wastagePercent,
      purchaseCost,
      sellingPriceEstimate,
      counterLocation
    } = req.body;

    if (name) product.name = name;
    if (category) {
      product.category = category;
      const cat = await Category.findById(category);
      if (cat) product.categoryName = cat.name;
    }
    if (designNumber !== undefined) product.designNumber = designNumber;
    if (purity) product.purity = purity;
    if (grossWeight !== undefined) product.grossWeight = roundWeight(grossWeight);
    if (stoneWeight !== undefined) product.stoneWeight = roundWeight(stoneWeight);
    product.netGoldWeight = roundWeight(product.grossWeight - product.stoneWeight);
    if (huid !== undefined) product.huid = (huid || '').toUpperCase();
    if (pricingType) product.pricingType = pricingType;
    if (fixedSellingPrice !== undefined) product.fixedSellingPrice = roundMoney(fixedSellingPrice);
    if (makingChargeType) product.makingChargeType = makingChargeType;
    if (makingChargeValue !== undefined) product.makingChargeValue = roundMoney(makingChargeValue);
    if (wastagePercent !== undefined) product.wastagePercent = Number(wastagePercent);
    if (purchaseCost !== undefined) product.purchaseCost = roundMoney(purchaseCost);
    if (sellingPriceEstimate !== undefined) product.sellingPriceEstimate = roundMoney(sellingPriceEstimate);
    if (counterLocation) product.counterLocation = counterLocation;

    await product.save();

    await logAudit({
      req,
      action: 'PRODUCT_UPDATED',
      resource: 'Product',
      resourceId: product._id,
      details: { itemId: product.itemId, name: product.name }
    });

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateTagStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'PRINTED' or 'VERIFIED'
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.tagStatus = status;
    if (status === 'VERIFIED') {
      product.verifiedAt = new Date();
      product.verifiedBy = req.user?._id;
    }
    await product.save();

    await logAudit({
      req,
      action: `TAG_STATUS_${status}`,
      resource: 'Product',
      resourceId: product._id,
      details: { itemId: product.itemId, tagStatus: status }
    });

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const verifyBarcode = async (req, res, next) => {
  try {
    const code = (req.params.code || '').trim().toUpperCase();
    const product = await Product.findOne({
      $or: [{ barcode: code }, { itemId: code }]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: `Barcode ${code} not found in inventory` });
    }

    product.tagStatus = 'VERIFIED';
    product.verifiedAt = new Date();
    product.verifiedBy = req.user?._id;
    await product.save();

    await logAudit({
      req,
      action: 'TAG_VERIFIED_SCAN',
      resource: 'Product',
      resourceId: product._id,
      details: { itemId: product.itemId, barcode: product.barcode }
    });

    res.json({
      success: true,
      message: `Tag verified successfully for ${product.itemId} · ${product.name}`,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

export const getTagQueue = async (req, res, next) => {
  try {
    const pendingProducts = await Product.find({
      stockStatus: 'AVAILABLE',
      tagStatus: { $in: ['PENDING', 'PRINTED'] }
    }).sort({ createdAt: -1 });

    const grouped = await Product.aggregate([
      { $match: { stockStatus: 'AVAILABLE', tagStatus: { $in: ['PENDING', 'PRINTED'] } } },
      { $group: { _id: '$categoryName', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: pendingProducts,
      summary: grouped
    });
  } catch (error) {
    next(error);
  }
};
