import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerLedger,
  recordCustomerPayment
} from '../controllers/customerController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id').get(getCustomerById).patch(updateCustomer);
router.get('/:id/ledger', getCustomerLedger);
router.post('/:id/payment', recordCustomerPayment);

export default router;
