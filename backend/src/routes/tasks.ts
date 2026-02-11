import { Router, Request, Response } from 'express';
import { taskService } from '../services/taskService.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  idParamSchema,
} from '../utils/validation.js';
import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

const router = Router();

// Task query schema
const taskQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  agentId: z.string().cuid().optional(),
  search: z.string().max(255).optional(),
  parentTaskId: z.string().cuid().optional(),
  rootOnly: z.coerce.boolean().optional(), // Only return tasks without parents
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Complete task schema
const completeTaskSchema = z.object({
  output: z.record(z.unknown()).optional(),
});

// Fail task schema
const failTaskSchema = z.object({
  errorMessage: z.string().min(1).max(2000),
});

// Assign task schema
const assignTaskSchema = z.object({
  agentId: z.string().cuid().nullable(),
});

// All task routes require authentication
router.use(authenticate);

/**
 * GET /api/tasks
 * List tasks with pagination and filtering
 */
router.get('/', validateQuery(taskQuerySchema), async (req: Request, res: Response) => {
  const query = req.query as any;
  
  // Handle rootOnly filter
  const params = {
    ...query,
    parentTaskId: query.rootOnly ? null : query.parentTaskId,
  };
  
  const result = await taskService.list(params, req.user!.id);
  
  res.json({
    success: true,
    data: result.tasks,
    pagination: result.pagination,
  });
});

/**
 * GET /api/tasks/stats
 * Get task statistics for the current user
 */
router.get('/stats', async (req: Request, res: Response) => {
  const stats = await taskService.getStats(req.user!.id);
  
  res.json({
    success: true,
    data: stats,
  });
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', validateBody(createTaskSchema), async (req: Request, res: Response) => {
  const task = await taskService.create(req.body, req.user!.id);
  
  res.status(201).json({
    success: true,
    data: task,
    message: 'Task created successfully',
  });
});

/**
 * GET /api/tasks/:id
 * Get a task by ID
 */
router.get('/:id', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const task = await taskService.getById(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: task,
  });
});

/**
 * PUT /api/tasks/:id
 * Update a task
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateTaskSchema),
  async (req: Request, res: Response) => {
    const task = await taskService.update(req.params.id, req.body, req.user!.id);
    
    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully',
    });
  }
);

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', validateParams(idParamSchema), async (req: Request, res: Response) => {
  await taskService.delete(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
});

// Task lifecycle management endpoints

/**
 * POST /api/tasks/:id/start
 * Start a task (transition to RUNNING)
 */
router.post('/:id/start', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const task = await taskService.start(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: task,
    message: 'Task started successfully',
  });
});

/**
 * POST /api/tasks/:id/complete
 * Complete a task with optional output
 */
router.post(
  '/:id/complete',
  validateParams(idParamSchema),
  validateBody(completeTaskSchema),
  async (req: Request, res: Response) => {
    const task = await taskService.complete(req.params.id, req.user!.id, req.body.output);
    
    res.json({
      success: true,
      data: task,
      message: 'Task completed successfully',
    });
  }
);

/**
 * POST /api/tasks/:id/fail
 * Mark a task as failed
 */
router.post(
  '/:id/fail',
  validateParams(idParamSchema),
  validateBody(failTaskSchema),
  async (req: Request, res: Response) => {
    const task = await taskService.fail(req.params.id, req.user!.id, req.body.errorMessage);
    
    res.json({
      success: true,
      data: task,
      message: 'Task marked as failed',
    });
  }
);

/**
 * POST /api/tasks/:id/cancel
 * Cancel a task
 */
router.post('/:id/cancel', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const task = await taskService.cancel(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: task,
    message: 'Task cancelled successfully',
  });
});

/**
 * POST /api/tasks/:id/retry
 * Retry a failed task
 */
router.post('/:id/retry', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const task = await taskService.retry(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: task,
    message: 'Task retry queued successfully',
  });
});

/**
 * POST /api/tasks/:id/pause
 * Pause a running task
 */
router.post('/:id/pause', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const task = await taskService.pause(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: task,
    message: 'Task paused successfully',
  });
});

/**
 * POST /api/tasks/:id/resume
 * Resume a paused task
 */
router.post('/:id/resume', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const task = await taskService.resume(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: task,
    message: 'Task resumed successfully',
  });
});

/**
 * POST /api/tasks/:id/assign
 * Assign or unassign a task to an agent
 */
router.post(
  '/:id/assign',
  validateParams(idParamSchema),
  validateBody(assignTaskSchema),
  async (req: Request, res: Response) => {
    const task = await taskService.assign(req.params.id, req.body.agentId, req.user!.id);
    
    res.json({
      success: true,
      data: task,
      message: req.body.agentId ? 'Task assigned successfully' : 'Task unassigned successfully',
    });
  }
);

/**
 * GET /api/tasks/:id/events
 * Get task event history
 */
router.get('/:id/events', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const events = await taskService.getEvents(req.params.id, req.user!.id, limit);
  
  res.json({
    success: true,
    data: events,
  });
});

export default router;
