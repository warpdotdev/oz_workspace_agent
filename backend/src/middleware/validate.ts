import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError, BadRequestError } from '../utils/errors.js';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Middleware factory for validating request data against a Zod schema
 */
export function validate<T>(schema: ZodSchema<T>, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const parsed = schema.parse(data);
      
      // Replace request data with parsed (and potentially transformed) data
      req[target] = parsed;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        }
        
        throw new ValidationError(errors);
      }
      
      throw new BadRequestError('Invalid request data');
    }
  };
}

/**
 * Validate request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return validate(schema, 'body');
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return validate(schema, 'query');
}

/**
 * Validate URL parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return validate(schema, 'params');
}
