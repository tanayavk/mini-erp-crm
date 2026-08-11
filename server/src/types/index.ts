import type { Request, Response, NextFunction } from 'express';
export type UserRole = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}