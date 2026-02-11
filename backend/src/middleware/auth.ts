import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { UserPayload, UserRole } from '../types/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Middleware to require specific roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  };
}

/**
 * Optional authentication - populates req.user if token present but doesn't fail
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.slice(7);
  
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserPayload;
    req.user = decoded;
  } catch {
    // Token invalid but we don't fail - just don't set user
  }
  
  next();
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: { id: string; email: string; role: UserRole }): string {
  const payload: UserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  
  const expiresInSeconds = getTokenExpiresIn();
  
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: expiresInSeconds,
  });
}

/**
 * Parse JWT expiration time to seconds
 */
export function getTokenExpiresIn(): number {
  const expiresIn = config.jwtExpiresIn;
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    return 86400; // Default 24 hours
  }
  
  const [, value, unit] = match;
  const num = parseInt(value, 10);
  
  switch (unit) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 3600;
    case 'd': return num * 86400;
    default: return 86400;
  }
}
