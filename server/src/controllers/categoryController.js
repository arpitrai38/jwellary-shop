import { Category } from '../models/Category.js';
import { logAudit } from '../utils/auditLogger.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, code, defaultMakingChargeType, defaultMakingChargeValue, defaultWastagePercent } = req.body;
    const existing = await Category.findOne({
      $or: [{ name: new RegExp(`^${name}$`, 'i') }, { code: code.toUpperCase() }]
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Category name or code already exists' });
    }

    const category = await Category.create({
      name,
      code: code.toUpperCase(),
      defaultMakingChargeType,
      defaultMakingChargeValue,
      defaultWastagePercent
    });

    await logAudit({
      req,
      action: 'CATEGORY_CREATED',
      resource: 'Category',
      resourceId: category._id,
      details: { name: category.name, code: category.code }
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};
