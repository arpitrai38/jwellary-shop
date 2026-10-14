import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  getSupplierLedger,
  recordSupplierPayment
} from '../controllers/supplierController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getSuppliers).post(authorize('OWNER', 'MANAGER'), createSupplier);
router.route('/:id').get(getSupplierById).patch(authorize('OWNER', 'MANAGER'), updateSupplier);
router.get('/:id/ledger', getSupplierLedger);
router.post('/:id/payment', authorize('OWNER', 'MANAGER'), recordSupplierPayment);

export default router;
