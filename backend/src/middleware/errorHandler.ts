import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { config } from '../config/index.js';
import { AppError, ValidationError } from '../utils/errors.js';

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // Default error response
  const response: ErrorResponse = {
    success: false,
    error: 'Internal server error',
  };

  let statusCode = 500;

  // Handle our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error = err.message;
    response.code = err.code;

    if (err instanceof ValidationError) {
      response.errors = err.errors;
    }
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        statusCode = 409;
        response.error = 'Resource already exists';
        response.code = 'CONFLICT';
        break;
      case 'P2025':
        // Record not found
        statusCode = 404;
        response.error = 'Resource not found';
        response.code = 'NOT_FOUND';
        break;
      case 'P2003':
        // Foreign key constraint failed
        statusCode = 400;
        response.error = 'Invalid reference';
        response.code = 'INVALID_REFERENCE';
        break;
      default:
        response.error = 'Database error';
        response.code = 'DATABASE_ERROR';
    }
  }
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    response.error = 'Invalid data provided';
    response.code = 'VALIDATION_ERROR';
  }
  // Handle JSON parsing errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    response.error = 'Invalid JSON';
    response.code = 'INVALID_JSON';
  }

  // Include stack trace in development
  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
}
