import { Router } from 'express';
import {
  createChallan,
  updateChallanStatus,
  listChallans,
  getChallanById
} from '../controllers/challanController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// Apply authentication middleware globally to all sales challan routes
router.use(authenticateToken);

// 1. Create Sales Challan - Draft or Confirmed (Admin, Sales)
router.post(
  '/',
  authorizeRoles('Admin', 'Sales'),
  createChallan
);

// 2. Update Sales Challan Status - Confirm or Cancel (Admin, Sales)
router.patch(
  '/:id/status',
  authorizeRoles('Admin', 'Sales'),
  updateChallanStatus
);

// 3. List & Search Sales Challans (Admin, Sales, Warehouse, Accounts)
router.get(
  '/',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  listChallans
);

// 4. View Single Sales Challan Details (Admin, Sales, Warehouse, Accounts)
router.get(
  '/:id',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  getChallanById
);

export default router;