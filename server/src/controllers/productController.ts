import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/db.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';

// --- Joi Validation Schemas ---

export const createProductSchema = Joi.object({
  name: Joi.string().required().trim().messages({
    'any.required': 'Product name is required'
  }),
  sku: Joi.string().required().trim().messages({
    'any.required': 'SKU is required'
  }),
  category: Joi.string().required().trim().messages({
    'any.required': 'Category is required'
  }),
  unit_price: Joi.number().positive().required().messages({
    'number.positive': 'Unit price must be a positive number',
    'any.required': 'Unit price is required'
  }),
  current_stock: Joi.number().integer().min(0).required().messages({
    'number.min': 'Current stock cannot be negative',
    'any.required': 'Current stock is required'
  }),
  min_stock_alert: Joi.number().integer().min(0).default(5),
  location: Joi.string().required().trim().messages({
    'any.required': 'Location is required'
  })
});

export const updateProductSchema = Joi.object({
  name: Joi.string().optional().trim(),
  sku: Joi.string().optional().trim(),
  category: Joi.string().optional().trim(),
  unit_price: Joi.number().positive().optional(),
  current_stock: Joi.number().integer().min(0).optional(),
  min_stock_alert: Joi.number().integer().min(0).optional(),
  location: Joi.string().optional().trim()
}).min(1);

export const listProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null).optional().trim(),
  low_stock: Joi.boolean().optional()
});

export const adjustStockSchema = Joi.object({
  quantity_changed: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity changed must be at least 1',
    'any.required': 'Quantity changed is required'
  }),
  movement_type: Joi.string().valid('IN', 'OUT').required().messages({
    'any.only': 'Movement type must be IN or OUT',
    'any.required': 'Movement type is required'
  }),
  reason: Joi.string().required().trim().messages({
    'any.required': 'Reason is required'
  })
});

export const stockLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  product_id: Joi.number().integer().optional()
});

// --- Helper Functions ---

const formatProduct = (product: any) => ({
  ...product,
  is_low_stock: Number(product.current_stock) <= Number(product.min_stock_alert)
});

// --- Controller Functions ---

/**
 * 1. POST /api/products
 * Add new product record.
 */
export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value: validatedData } = createProductSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return next(error);
    }

    const { name, sku, category, unit_price, current_stock, min_stock_alert, location } = validatedData;

    // Check for Duplicate SKU
    const [existingSku] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM products WHERE sku = ?',
      [sku]
    );

    if (existingSku.length > 0) {
      throw new AppError(`Product with SKU '${sku}' already exists`, 400);
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, category, unit_price, current_stock, min_stock_alert ?? 5, location]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: formatProduct(rows[0])
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/products
 * List, filter, search products & low stock alerts with pagination.
 */
export const listProducts = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value: query } = listProductsQuerySchema.validate(req.query, {
      abortEarly: false
    });

    if (error) {
      return next(error);
    }

    const page = Number(query.page);
    const limit = Number(query.limit);
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      whereClauses.push('(name LIKE ? OR sku LIKE ? OR category LIKE ? OR location LIKE ?)');
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (query.low_stock === true || query.low_stock === 'true') {
      whereClauses.push('current_stock <= min_stock_alert');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matched records
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM products ${whereSql}`,
      queryParams
    );
    const total = countRows?.[0]?.total || 0;

    // Fetch paginated products
    const dataQueryParams = [...queryParams, limit, offset];
    const [products] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM products ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      dataQueryParams
    );

    const totalPages = Math.ceil(total / limit) || 1;
    const formattedProducts = products.map(formatProduct);

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: {
        items: formattedProducts,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/products/:id
 * Retrieve product details by ID.
 */
export const getProductById = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = req.params.id;

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    if (rows.length === 0) {
      throw new AppError(`Product with ID ${productId} not found`, 404);
    }

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: formatProduct(rows[0])
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/products/:id
 * Edit product attributes.
 */
export const updateProduct = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = req.params.id;

    const { error, value: validatedData } = updateProductSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return next(error);
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id, sku FROM products WHERE id = ?',
      [productId]
    );

    if (existing.length === 0) {
      throw new AppError(`Product with ID ${productId} not found`, 404);
    }

    // Check SKU duplicate if changing SKU
    if (validatedData.sku && validatedData.sku !== existing[0]?.sku) {
      const [duplicateSku] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM products WHERE sku = ? AND id != ?',
        [validatedData.sku, productId]
      );

      if (duplicateSku.length > 0) {
        throw new AppError(`Product with SKU '${validatedData.sku}' already exists`, 400);
      }
    }

    const fields = Object.keys(validatedData);
    if (fields.length === 0) {
      throw new AppError('No update fields provided', 400);
    }

    const setClauses = fields.map((field) => `${field} = ?`).join(', ');
    const values = fields.map((field) => validatedData[field]);
    values.push(productId);

    await pool.query(
      `UPDATE products SET ${setClauses} WHERE id = ?`,
      values
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: formatProduct(updatedRows[0])
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /api/products/:id/stock
 * Perform manual stock adjustment using atomic transaction locking.
 */
export const adjustStock = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    const productId = req.params.id;

    const { error, value: validatedData } = adjustStockSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      connection.release();
      return next(error);
    }

    const userId = req.user?.id;
    if (!userId) {
      connection.release();
      throw new AppError('User authentication context missing', 401);
    }

    const { quantity_changed, movement_type, reason } = validatedData;

    // Begin atomic transaction
    await connection.beginTransaction();

    // Lock target product row for update
    const [productRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, name, current_stock, min_stock_alert FROM products WHERE id = ? FOR UPDATE',
      [productId]
    );

    if (productRows.length === 0) {
      await connection.rollback();
      connection.release();
      throw new AppError(`Product with ID ${productId} not found`, 404);
    }

    const product = productRows[0];
    if (!product) {
      await connection.rollback();
      connection.release();
      throw new AppError(`Product with ID ${productId} not found`, 404);
    }

    const currentStock = Number(product.current_stock);
    let newStock = currentStock;

    if (movement_type === 'OUT') {
      if (currentStock < quantity_changed) {
        await connection.rollback();
        connection.release();
        throw new AppError(`Insufficient stock for reduction. Available: ${currentStock}, Requested: ${quantity_changed}`, 400);
      }
      newStock -= quantity_changed;
    } else {
      newStock += quantity_changed;
    }

    // Update Product Stock Level
    await connection.query(
      'UPDATE products SET current_stock = ? WHERE id = ?',
      [newStock, productId]
    );

    // Insert Log Entry into stock_logs
    await connection.query(
      `INSERT INTO stock_logs (product_id, quantity_changed, movement_type, reason, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [productId, quantity_changed, movement_type, reason, userId]
    );

    // Commit Transaction
    await connection.commit();
    connection.release();

    res.status(200).json({
      success: true,
      message: `Stock successfully adjusted (${movement_type})`,
      data: {
        product_id: Number(productId),
        product_name: product.name,
        previous_stock: currentStock,
        new_stock: newStock,
        quantity_changed,
        movement_type,
        is_low_stock: newStock <= Number(product.min_stock_alert)
      }
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

/**
 * 6. GET /api/products/stock-logs/all
 * View global or product-specific stock movement logs.
 */
export const getStockLogs = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value: query } = stockLogsQuerySchema.validate(req.query, {
      abortEarly: false
    });

    if (error) {
      return next(error);
    }

    const page = Number(query.page);
    const limit = Number(query.limit);
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const queryParams: any[] = [];

    if (query.product_id) {
      whereClauses.push('sl.product_id = ?');
      queryParams.push(query.product_id);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count Total Logs
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM stock_logs sl ${whereSql}`,
      queryParams
    );
    const total = countRows[0]?.total ?? 0;

    // Fetch Paginated Logs Joined with Products & Users
    const dataQueryParams = [...queryParams, limit, offset];
    const [logs] = await pool.query<RowDataPacket[]>(
      `SELECT 
        sl.id,
        sl.product_id,
        p.name as product_name,
        p.sku as product_sku,
        sl.quantity_changed,
        sl.movement_type,
        sl.reason,
        sl.created_at,
        sl.created_by,
        u.email as performed_by_email,
        u.role as performed_by_role
       FROM stock_logs sl
       INNER JOIN products p ON sl.product_id = p.id
       LEFT JOIN users u ON sl.created_by = u.id
       ${whereSql}
       ORDER BY sl.created_at DESC
       LIMIT ? OFFSET ?`,
      dataQueryParams
    );

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      message: 'Stock movement logs retrieved successfully',
      data: {
        items: logs,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};