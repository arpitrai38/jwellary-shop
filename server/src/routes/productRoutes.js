import express from 'express';
import {
  getProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  updateTagStatus,
  verifyBarcode,
  getTagQueue
} from '../controllers/productController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/tag-queue', getTagQueue);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/:id', getProductById);

router.post('/', protect, authorize('OWNER', 'MANAGER', 'STOCK_STAFF'), createProduct);
router.patch('/:id', protect, authorize('OWNER', 'MANAGER', 'STOCK_STAFF'), updateProduct);
router.patch('/:id/tag-status', protect, updateTagStatus);
router.post('/verify/:code', protect, verifyBarcode);

export default router;
