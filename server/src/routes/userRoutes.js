import express from 'express';
import { getUsers, createUser, updateUser, toggleUserStatus } from '../controllers/userController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'MANAGER'));

router.route('/').get(getUsers).post(createUser);
router.route('/:id').patch(updateUser);
router.route('/:id/toggle-status').patch(toggleUserStatus);

export default router;
