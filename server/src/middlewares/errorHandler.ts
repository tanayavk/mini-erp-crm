import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import type { ApiResponse } from '../types/index.js';

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails: any = err.error || undefined;

  if (Joi.isError(err)) {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = err.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, '')
    }));
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid JWT token signature';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'JWT token has expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorDetails !== undefined && { error: errorDetails })
  });
};