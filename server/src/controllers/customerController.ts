import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/db.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';

// --- Joi Validation Schemas ---

export const createCustomerSchema = Joi.object({
  name: Joi.string().required().trim().messages({
    'any.required': 'Name is required'
  }),
  mobile: Joi.string().required().trim().messages({
    'any.required': 'Mobile is required'
  }),
  email: Joi.string().email().required().trim().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  business_name: Joi.string().required().trim().messages({
    'any.required': 'Business name is required'
  }),
  gst_number: Joi.string().allow('', null).optional().trim(),
  type: Joi.string()
    .valid('Retail', 'Wholesale', 'Distributor', 'Lead')
    .required()
    .messages({
      'any.only': 'Type must be one of Retail, Wholesale, Distributor, or Lead',
      'any.required': 'Type is required'
    }),
  address: Joi.string().required().trim().messages({
    'any.required': 'Address is required'
  }),
  status: Joi.string()
    .valid('Lead', 'Active', 'Inactive')
    .required()
    .messages({
      'any.only': 'Status must be one of Lead, Active, or Inactive',
      'any.required': 'Status is required'
    })
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().optional().trim(),
  mobile: Joi.string().optional().trim(),
  email: Joi.string().email().optional().trim(),
  business_name: Joi.string().optional().trim(),
  gst_number: Joi.string().allow('', null).optional().trim(),
  type: Joi.string().valid('Retail', 'Wholesale', 'Distributor', 'Lead').optional(),
  address: Joi.string().optional().trim(),
  status: Joi.string().valid('Lead', 'Active', 'Inactive').optional()
}).min(1);

export const listCustomersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('', null).optional().trim(),
  status: Joi.string().valid('Lead', 'Active', 'Inactive').optional(),
  type: Joi.string().valid('Retail', 'Wholesale', 'Distributor', 'Lead').optional()
});

export const addCustomerNoteSchema = Joi.object({
  note: Joi.string().required().trim().messages({
    'any.required': 'Note is required'
  }),
  follow_up_date: Joi.date().iso().required().messages({
    'date.format': 'follow_up_date must be a valid ISO date string',
    'any.required': 'follow_up_date is required'
  })
});

// --- Controller Functions ---

/**
 * 1. POST /api/customers
 * Create a new customer record.
 */
export const createCustomer = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value: validatedData } = createCustomerSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return next(error);
    }

    const { name, mobile, email, business_name, gst_number, type, address, status } = validatedData;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO customers (name, mobile, email, business_name, gst_number, type, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, mobile, email, business_name, gst_number || null, type, address, status]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/customers
 * List and search customers with pagination and dynamic filtering.
 */
export const listCustomers = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value: query } = listCustomersQuerySchema.validate(req.query, {
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
      whereClauses.push('(name LIKE ? OR mobile LIKE ? OR email LIKE ? OR business_name LIKE ?)');
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (query.status) {
      whereClauses.push('status = ?');
      queryParams.push(query.status);
    }

    if (query.type) {
      whereClauses.push('type = ?');
      queryParams.push(query.type);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Query Total Records
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM customers ${whereSql}`,
      queryParams
    );
    const total = countRows[0]?.total ?? 0;

    // Query Paginated Data
    const dataQueryParams = [...queryParams, limit, offset];
    const [customers] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM customers ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      dataQueryParams
    );

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: {
        items: customers,
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
 * 3. GET /api/customers/:id
 * Retrieve customer details along with aggregated follow-up notes.
 */
export const getCustomerById = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.params.id;

    const [customerRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    if (customerRows.length === 0) {
      throw new AppError(`Customer with ID ${customerId} not found`, 404);
    }

    const [notesRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        cn.id, 
        cn.note, 
        cn.follow_up_date, 
        cn.created_at, 
        cn.created_by,
        u.email as creator_email,
        u.role as creator_role
       FROM customer_notes cn
       LEFT JOIN users u ON cn.created_by = u.id
       WHERE cn.customer_id = ?
       ORDER BY cn.created_at DESC`,
      [customerId]
    );

    const customerData = {
      ...customerRows[0],
      notes: notesRows
    };

    res.status(200).json({
      success: true,
      message: 'Customer details retrieved successfully',
      data: customerData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/customers/:id
 * Update customer details.
 */
export const updateCustomer = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.params.id;

    const { error, value: validatedData } = updateCustomerSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return next(error);
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM customers WHERE id = ?',
      [customerId]
    );

    if (existing.length === 0) {
      throw new AppError(`Customer with ID ${customerId} not found`, 404);
    }

    const fields = Object.keys(validatedData);
    if (fields.length === 0) {
      throw new AppError('No update fields provided', 400);
    }

    const setClauses = fields.map((field) => `${field} = ?`).join(', ');
    const values = fields.map((field) => validatedData[field]);

    values.push(customerId);

    await pool.query(
      `UPDATE customers SET ${setClauses} WHERE id = ?`,
      values
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /api/customers/:id/notes
 * Add a follow-up note to a specific customer.
 */
export const addCustomerNote = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.params.id;

    const { error, value: validatedData } = addCustomerNoteSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return next(error);
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM customers WHERE id = ?',
      [customerId]
    );

    if (existing.length === 0) {
      throw new AppError(`Customer with ID ${customerId} not found`, 404);
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User authentication context missing', 401);
    }

    const { note, follow_up_date } = validatedData;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO customer_notes (customer_id, note, follow_up_date, created_by)
       VALUES (?, ?, ?, ?)`,
      [customerId, note, follow_up_date, userId]
    );

    const [insertedNote] = await pool.query<RowDataPacket[]>(
      `SELECT 
        cn.id, 
        cn.customer_id, 
        cn.note, 
        cn.follow_up_date, 
        cn.created_at, 
        cn.created_by,
        u.email as creator_email,
        u.role as creator_role
       FROM customer_notes cn
       LEFT JOIN users u ON cn.created_by = u.id
       WHERE cn.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Follow-up note added successfully',
      data: insertedNote[0]
    });
  } catch (error) {
    next(error);
  }
};