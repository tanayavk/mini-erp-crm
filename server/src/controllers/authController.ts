import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import type { RowDataPacket } from 'mysql2';
import pool from '../config/db.js';
import type { ApiResponse, JwtPayload, UserRole } from '../types/index.js';
import { AppError } from '../middlewares/errorHandler.js';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email address format',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(1).required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
});

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
}

export const login = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value: validatedData } = loginSchema.validate(req.body, {
      abortEarly: false
    });

    if (error) {
      return next(error);
    }

    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
      [validatedData.email]
    );

    if (rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const [user] = rows as UserRow[];
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }
    const passwordHash = user.password_hash;
    const isPasswordValid = await bcrypt.compare(validatedData.password, passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError('JWT secret is not configured on server', 500);
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};