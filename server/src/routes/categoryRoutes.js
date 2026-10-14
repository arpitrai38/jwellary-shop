import express from 'express';
import { getCategories, createCategory, updateCategory } from '../controllers/categoryController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', protect, authorize('OWNER', 'MANAGER'), createCategory);
router.patch('/:id', protect, authorize('OWNER', 'MANAGER'), updateCategory);

export default router;
