import express from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('OWNER'), getAuditLogs);

export default router;
