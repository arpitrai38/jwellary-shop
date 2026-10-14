import express from 'express';
import { getExpenses, createExpense } from '../controllers/expenseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getExpenses).post(authorize('OWNER', 'MANAGER'), createExpense);

export default router;
