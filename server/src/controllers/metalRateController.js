import { MetalRate } from '../models/MetalRate.js';
import { logAudit } from '../utils/auditLogger.js';

export const getLatestRates = async (req, res, next) => {
  try {
    const rates = await MetalRate.find({ metal: 'GOLD', isCurrent: true }).sort({ fineness: -1 });
    res.json({ success: true, data: rates });
  } catch (error) {
    next(error);
  }
};

export const getRateHistory = async (req, res, next) => {
  try {
    const history = await MetalRate.find({ metal: 'GOLD' })
      .sort({ effectiveFrom: -1 })
      .limit(50);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

export const updateRates = async (req, res, next) => {
  try {
    const { rates, notes } = req.body; // array of { purity: '22K', ratePerGram: 6850 }

    if (!Array.isArray(rates) || rates.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid rates array' });
    }

    const finenessMap = {
      '24K': 999,
      '22K': 916,
      '18K': 750,
      '14K': 585
    };

    const updatedEntries = [];

    for (const item of rates) {
      if (!finenessMap[item.purity] || !item.ratePerGram || item.ratePerGram <= 0) {
        continue;
      }

      // Mark previous current as false for this purity
      await MetalRate.updateMany(
        { metal: 'GOLD', purity: item.purity, isCurrent: true },
        { $set: { isCurrent: false } }
      );

      // Create new active rate
      const newRate = await MetalRate.create({
        metal: 'GOLD',
        purity: item.purity,
        fineness: finenessMap[item.purity],
        ratePerGram: Number(item.ratePerGram),
        effectiveFrom: new Date(),
        isCurrent: true,
        updatedBy: req.user?._id,
        updatedByName: req.user?.name || 'Authorized Admin',
        notes: notes || ''
      });

      updatedEntries.push(newRate);
    }

    await logAudit({
      req,
      action: 'GOLD_RATES_UPDATED',
      resource: 'MetalRate',
      details: { updatedRates: rates, notes }
    });

    res.json({
      success: true,
      message: 'Gold rates updated successfully',
      data: updatedEntries
    });
  } catch (error) {
    next(error);
  }
};
