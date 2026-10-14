import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({
  req,
  action,
  resource,
  resourceId = '',
  details = {}
}) => {
  try {
    const user = req?.user;
    await AuditLog.create({
      user: user?._id || null,
      userName: user?.name || 'System / Anonymous',
      userRole: user?.role || 'SYSTEM',
      action,
      resource,
      resourceId: String(resourceId),
      details,
      ipAddress: req?.ip || req?.socket?.remoteAddress || ''
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};
