import express from 'express';
import { calculatePricing, createSale, getSales, getSaleById, cancelSale } from '../controllers/saleController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/calculate-pricing', calculatePricing);
router.route('/').get(getSales).post(authorize('OWNER', 'MANAGER', 'CASHIER'), createSale);
router.route('/:id').get(getSaleById);
router.patch('/:id/cancel', authorize('OWNER', 'MANAGER'), cancelSale);

export default router;
