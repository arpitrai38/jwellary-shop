import express from 'express';
import {
  getSalesReport,
  getStockReport,
  getProfitReport,
  getGstReport,
  exportReportExcel
} from '../controllers/reportController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'MANAGER'));

router.get('/sales', getSalesReport);
router.get('/stock', getStockReport);
router.get('/profit', getProfitReport);
router.get('/gst', getGstReport);
router.get('/export-excel', exportReportExcel);

export default router;
