import { Router, Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../utils/validation.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  
  res.status(201).json({
    success: true,
    data: result,
    message: 'User registered successfully',
  });
});

/**
 * POST /api/auth/login
 * Login an existing user
 */
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  
  res.json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  
  res.json({
    success: true,
    data: user,
  });
});

export default router;
