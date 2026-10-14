import express from 'express';
import { getPurchases, getPurchaseById, createPurchase } from '../controllers/purchaseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/guided-inward', authorize('OWNER', 'MANAGER', 'STOCK_STAFF'), createPurchase);

export default router;
