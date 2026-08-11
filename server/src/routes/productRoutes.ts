import { Router } from 'express';
import {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  adjustStock,
  getStockLogs
} from '../controllers/productController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// Apply authentication middleware globally across all product routes
router.use(authenticateToken);

// 6. View Stock Movement Logs (Admin, Sales, Warehouse, Accounts)
// Placed before /:id to prevent route shadowing
router.get(
  '/stock-logs/all',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  getStockLogs
);

// 1. Create Product (Admin, Warehouse)
router.post(
  '/',
  authorizeRoles('Admin', 'Warehouse'),
  createProduct
);

// 2. List, Search, Filter & Low Stock Products (Admin, Sales, Warehouse, Accounts)
router.get(
  '/',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  listProducts
);

// 3. View Single Product Details (Admin, Sales, Warehouse, Accounts)
router.get(
  '/:id',
  authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'),
  getProductById
);

// 4. Update Product (Admin, Warehouse)
router.put(
  '/:id',
  authorizeRoles('Admin', 'Warehouse'),
  updateProduct
);

// 5. Adjust Stock / Stock Movement (Admin, Warehouse)
router.post(
  '/:id/stock',
  authorizeRoles('Admin', 'Warehouse'),
  adjustStock
);

export default router;