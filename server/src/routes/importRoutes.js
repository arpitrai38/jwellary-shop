import express from 'express';
import { getImportTemplate, previewImport, confirmImport } from '../controllers/importController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/template', getImportTemplate);
router.post('/preview', protect, authorize('OWNER', 'MANAGER', 'STOCK_STAFF'), previewImport);
router.post('/confirm', protect, authorize('OWNER', 'MANAGER', 'STOCK_STAFF'), confirmImport);

export default router;
