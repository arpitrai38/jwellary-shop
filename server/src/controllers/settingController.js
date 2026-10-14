import { Setting } from '../models/Setting.js';
import { logAudit } from '../utils/auditLogger.js';

export const getSettings = async (req, res, next) => {
  try {
    let setting = await Setting.findOne({ key: 'main_shop_config' });
    if (!setting) {
      setting = await Setting.create({ key: 'main_shop_config' });
    }
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: 'main_shop_config' },
      { $set: req.body },
      { new: true, upsert: true }
    );

    await logAudit({
      req,
      action: 'SETTINGS_UPDATED',
      resource: 'Setting',
      details: req.body
    });

    res.json({ success: true, message: 'Settings updated successfully', data: setting });
  } catch (error) {
    next(error);
  }
};
