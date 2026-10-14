import express from 'express';
import { getLatestRates, getRateHistory, updateRates } from '../controllers/metalRateController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/latest', getLatestRates);
router.get('/history', getRateHistory);
router.post('/update', protect, authorize('OWNER', 'MANAGER'), updateRates);

export default router;
