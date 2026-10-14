import { AuditLog } from '../models/AuditLog.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, resource, limit = 100 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (resource) query.resource = resource;

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(parseInt(limit, 10));

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
