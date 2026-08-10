import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest, UserRole } from '../types/index.js';

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User context missing',
        error: 'Unauthorized'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to perform this action`,
        error: 'Forbidden'
      });
      return;
    }

    next();
  };
};