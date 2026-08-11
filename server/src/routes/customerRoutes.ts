import { Router } from 'express';
import {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  addCustomerNote
} from '../controllers/customerController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// Apply authentication middleware globally to all customer endpoints
router.use(authenticateToken);

// 1. Create Customer (Admin, Sales)
router.post(
  '/',
  authorizeRoles('Admin', 'Sales'),
  createCustomer
);

// 2. List & Search Customers (Admin, Sales, Warehouse, Accounts)
router.get(
  '/',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  listCustomers
);

// 3. View Customer Details with Aggregated Notes (Admin, Sales, Warehouse, Accounts)
router.get(
  '/:id',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  getCustomerById
);

// 4. Update Customer (Admin, Sales)
router.put(
  '/:id',
  authorizeRoles('Admin', 'Sales'),
  updateCustomer
);

// 5. Add Follow-Up Note (Admin, Sales)
router.post(
  '/:id/notes',
  authorizeRoles('Admin', 'Sales'),
  addCustomerNote
);

export default router;