import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import pool from '../config/db.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';
import { generateChallanNo } from '../utils/generateChallanNo.js';

// --- Joi Validation Schemas ---

const challanItemSchema = Joi.object({
  product_id: Joi.number().integer().positive().required().messages({
    'number.base': 'product_id must be a number',
    'any.required': 'product_id is required'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required'
  })
});

export const createChallanSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required().messages({
    'number.base': 'customer_id must be a number',
    'any.required': 'customer_id is required'
  }),
  status: Joi.string().valid('Draft', 'Confirmed').default('Draft'),
  items: Joi.array().items(challanItemSchema).min(1).required().messages({
    'array.min': 'At least one item is required in the challan',
    'any.required': 'items array is required'
  })
});

export const updateChallanStatusSchema = Joi.object({
  status: Joi.string().valid('Confirmed', 'Cancelled').required().messages({
    'any.only': 'Status must be either Confirmed or Cancelled',
    'any.required': 'Status is required'
  })
});

export const listChallansQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null).optional().trim(),
  status: Joi.string().valid('Draft', 'Confirmed', 'Cancelled').optional()
});

// --- Controller Functions ---

/**
 * 1. POST /api/challans
 * Create Sales Challan (Draft or Confirmed)
 */
export const createChallan = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  let connection: PoolConnection | null = null;

  try {
    const { error, value: validatedData } = createChallanSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return next(error);
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User authentication context missing', 401);
    }

    const { customer_id, status, items } = validatedData as {
      customer_id: number;
      status: 'Draft' | 'Confirmed';
      items: Array<{ product_id: number; quantity: number }>;
    };

    connection = await pool.getConnection();

    // Verify Customer Exists
    const [customerRows] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM customers WHERE id = ?',
      [customer_id]
    );

    if (customerRows.length === 0) {
      connection.release();
      throw new AppError(`Customer with ID ${customer_id} not found`, 404);
    }

    // Begin Atomic Transaction
    await connection.beginTransaction();

    const challanNumber = await generateChallanNo();
    let totalQuantity = 0;

    // Consolidate duplicate products if sent in items array
    const itemMap = new Map<number, number>();
    for (const item of items) {
      const currentQty = itemMap.get(item.product_id) || 0;
      itemMap.set(item.product_id, currentQty + item.quantity);
      totalQuantity += item.quantity;
    }

    const productIds = Array.from(itemMap.keys());

    // Fetch and Lock Product Records
    const placeholders = productIds.map(() => '?').join(',');
    const [productRows] = await connection.query<RowDataPacket[]>(
      `SELECT id, name, unit_price, current_stock FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
      productIds
    );

    if (productRows.length !== productIds.length) {
      await connection.rollback();
      connection.release();
      throw new AppError('One or more requested products do not exist', 404);
    }

    const productMap = new Map<number, { name: string; unit_price: number; current_stock: number }>();
    for (const prod of productRows) {
      productMap.set(prod.id, {
        name: prod.name,
        unit_price: Number(prod.unit_price),
        current_stock: Number(prod.current_stock)
      });
    }

    // IF Confirmed: Stock validation & reduction
    if (status === 'Confirmed') {
      for (const [productId, reqQuantity] of itemMap.entries()) {
        const product = productMap.get(productId);
        if (!product) {
          await connection.rollback();
          connection.release();
          throw new AppError(`Product with ID ${productId} not found`, 404);
        }

        if (product.current_stock < reqQuantity) {
          await connection.rollback();
          connection.release();
          throw new AppError(
            `Insufficient stock for product '${product.name}' (ID: ${productId}). Available: ${product.current_stock}, Requested: ${reqQuantity}`,
            400
          );
        }
      }

      // Deduct stock and write stock logs
      for (const [productId, reqQuantity] of itemMap.entries()) {
        await connection.query(
          'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
          [reqQuantity, productId]
        );

        await connection.query(
          `INSERT INTO stock_logs (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES (?, ?, 'OUT', ?, ?)`,
          [productId, reqQuantity, `Sales Challan Confirmed: ${challanNumber}`, userId]
        );
      }
    }

    // Insert Master Record into sales_challans
    const [challanResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO sales_challans (challan_number, customer_id, total_quantity, status, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [challanNumber, customer_id, totalQuantity, status, userId]
    );

    const challanId = challanResult.insertId;

    // Insert Line Items into challan_items
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) continue;

      await connection.query(
        `INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, unit_price_snapshot, quantity)
         VALUES (?, ?, ?, ?, ?)`,
        [challanId, item.product_id, product.name, product.unit_price, item.quantity]
      );
    }

    await connection.commit();
    connection.release();

    // Fetch Full Response Payload
    const [createdChallanRows] = await pool.query<RowDataPacket[]>(
      `SELECT sc.*, c.name as customer_name, u.email as creator_email
       FROM sales_challans sc
       INNER JOIN customers c ON sc.customer_id = c.id
       LEFT JOIN users u ON sc.created_by = u.id
       WHERE sc.id = ?`,
      [challanId]
    );

    const [itemRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM challan_items WHERE challan_id = ?',
      [challanId]
    );

    const responseData = {
      ...(createdChallanRows[0] || {}),
      items: itemRows
    };

    res.status(201).json({
      success: true,
      message: `Sales Challan created successfully as ${status}`,
      data: responseData
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {
        // Rollback ignored if connection not active
      }
      connection.release();
    }
    next(error);
  }
};

/**
 * 2. PATCH /api/challans/:id/status
 * Update Sales Challan Status (Confirm a Draft or Cancel)
 */
export const updateChallanStatus = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  let connection: PoolConnection | null = null;

  try {
    const challanId = req.params.id;

    const { error, value: validatedData } = updateChallanStatusSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return next(error);
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User authentication context missing', 401);
    }

    const { status: targetStatus } = validatedData as { status: 'Confirmed' | 'Cancelled' };

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Lock and Fetch Sales Challan
    const [challanRows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM sales_challans WHERE id = ? FOR UPDATE',
      [challanId]
    );

    if (challanRows.length === 0) {
      await connection.rollback();
      connection.release();
      throw new AppError(`Sales Challan with ID ${challanId} not found`, 404);
    }

    const challan = challanRows[0];
    if (!challan) {
      await connection.rollback();
      connection.release();
      throw new AppError(`Sales Challan with ID ${challanId} not found`, 404);
    }

    const currentStatus: string = challan.status;

    if (currentStatus === 'Confirmed' || currentStatus === 'Cancelled') {
      await connection.rollback();
      connection.release();
      throw new AppError(
        `Cannot change status of a challan that is already '${currentStatus}'`,
        400
      );
    }

    // Fetch Challan Items
    const [items] = await connection.query<RowDataPacket[]>(
      'SELECT product_id, quantity, product_name_snapshot FROM challan_items WHERE challan_id = ?',
      [challanId]
    );

    if (items.length === 0) {
      await connection.rollback();
      connection.release();
      throw new AppError('Challan has no items associated with it', 400);
    }

    // IF Transitioning from Draft -> Confirmed
    if (targetStatus === 'Confirmed') {
      const itemMap = new Map<number, { quantity: number; name: string }>();
      for (const item of items) {
        const prodId = Number(item.product_id);
        const qty = Number(item.quantity);
        const name = String(item.product_name_snapshot);

        const existing = itemMap.get(prodId);
        if (existing) {
          existing.quantity += qty;
        } else {
          itemMap.set(prodId, { quantity: qty, name });
        }
      }

      const productIds = Array.from(itemMap.keys());
      const placeholders = productIds.map(() => '?').join(',');

      const [productRows] = await connection.query<RowDataPacket[]>(
        `SELECT id, name, current_stock FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
        productIds
      );

      const productMap = new Map<number, number>();
      for (const p of productRows) {
        productMap.set(p.id, Number(p.current_stock));
      }

      // Stock Validation
      for (const [prodId, data] of itemMap.entries()) {
        const availableStock = productMap.get(prodId);
        if (availableStock === undefined) {
          await connection.rollback();
          connection.release();
          throw new AppError(`Product with ID ${prodId} no longer exists`, 404);
        }

        if (availableStock < data.quantity) {
          await connection.rollback();
          connection.release();
          throw new AppError(
            `Insufficient stock for product '${data.name}' (ID: ${prodId}). Available: ${availableStock}, Requested: ${data.quantity}`,
            400
          );
        }
      }

      // Deduct stock and insert stock logs
      for (const [prodId, data] of itemMap.entries()) {
        await connection.query(
          'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
          [data.quantity, prodId]
        );

        await connection.query(
          `INSERT INTO stock_logs (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES (?, ?, 'OUT', ?, ?)`,
          [prodId, data.quantity, `Sales Challan Confirmed: ${challan.challan_number}`, userId]
        );
      }
    }

    // Update Status in sales_challans
    await connection.query(
      'UPDATE sales_challans SET status = ? WHERE id = ?',
      [targetStatus, challanId]
    );

    await connection.commit();
    connection.release();

    const [updatedChallanRows] = await pool.query<RowDataPacket[]>(
      `SELECT sc.*, c.name as customer_name, u.email as creator_email
       FROM sales_challans sc
       INNER JOIN customers c ON sc.customer_id = c.id
       LEFT JOIN users u ON sc.created_by = u.id
       WHERE sc.id = ?`,
      [challanId]
    );

    res.status(200).json({
      success: true,
      message: `Challan status updated to ${targetStatus}`,
      data: updatedChallanRows[0]
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (_) {
        // Rollback ignored
      }
      connection.release();
    }
    next(error);
  }
};

/**
 * 3. GET /api/challans
 * List & Search Sales Challans with Pagination
 */
export const listChallans = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value: query } = listChallansQuerySchema.validate(req.query, {
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
      whereClauses.push('(sc.challan_number LIKE ? OR c.name LIKE ? OR c.business_name LIKE ?)');
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (query.status) {
      whereClauses.push('sc.status = ?');
      queryParams.push(query.status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count Total Matching Records
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
       FROM sales_challans sc
       INNER JOIN customers c ON sc.customer_id = c.id
       ${whereSql}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    // Fetch Paginated Records
    const dataQueryParams = [...queryParams, limit, offset];
    const [challans] = await pool.query<RowDataPacket[]>(
      `SELECT 
        sc.id,
        sc.challan_number,
        sc.customer_id,
        c.name as customer_name,
        c.business_name as customer_business_name,
        sc.total_quantity,
        sc.status,
        sc.created_at,
        sc.created_by,
        u.email as creator_email,
        u.role as creator_role
       FROM sales_challans sc
       INNER JOIN customers c ON sc.customer_id = c.id
       LEFT JOIN users u ON sc.created_by = u.id
       ${whereSql}
       ORDER BY sc.created_at DESC
       LIMIT ? OFFSET ?`,
      dataQueryParams
    );

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      message: 'Sales challans retrieved successfully',
      data: {
        items: challans,
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
 * 4. GET /api/challans/:id
 * View Single Challan Details with Item Snapshots & Line Totals
 */
export const getChallanById = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const challanId = req.params.id;

    const [challanRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        sc.id,
        sc.challan_number,
        sc.customer_id,
        c.name as customer_name,
        c.mobile as customer_mobile,
        c.email as customer_email,
        c.business_name as customer_business_name,
        c.address as customer_address,
        sc.total_quantity,
        sc.status,
        sc.created_at,
        sc.created_by,
        u.email as creator_email,
        u.role as creator_role
       FROM sales_challans sc
       INNER JOIN customers c ON sc.customer_id = c.id
       LEFT JOIN users u ON sc.created_by = u.id
       WHERE sc.id = ?`,
      [challanId]
    );

    if (challanRows.length === 0 || !challanRows[0]) {
      throw new AppError(`Sales Challan with ID ${challanId} not found`, 404);
    }

    const [itemRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ci.id,
        ci.product_id,
        ci.product_name_snapshot,
        ci.unit_price_snapshot,
        ci.quantity,
        (ci.unit_price_snapshot * ci.quantity) as line_total
       FROM challan_items ci
       WHERE ci.challan_id = ?`,
      [challanId]
    );

    const challanData = {
      ...challanRows[0],
      items: itemRows
    };

    res.status(200).json({
      success: true,
      message: 'Sales challan details retrieved successfully',
      data: challanData
    });
  } catch (error) {
    next(error);
  }
};