import { Router, Request, Response } from 'express';
import { taskService } from '../services/taskService.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  idParamSchema,
  assignTaskSchema,
  completeTaskSchema,
  failTaskSchema,
} from '../utils/validation.js';

const router = Router();

// All task routes require authentication
router.use(authenticate);

/**
 * GET /api/tasks
 * List tasks with pagination and filtering
 */
router.get('/', validateQuery(taskQuerySchema), async (req: Request, res: Response) => {
  const result = await taskService.list(req.query as any, req.user!.id);
  
  res.json({
    success: true,
    data: result.tasks,
    pagination: result.pagination,
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
 * GET /api/tasks/stats
 * Get task statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  const stats = await taskService.getStats(req.user!.id);
  
  res.json({
    success: true,
    data: stats,
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
 * POST /api/tasks/:id/assign
 * Assign or unassign a task to an agent
 */
router.post(
  '/:id/assign',
  validateParams(idParamSchema),
  validateBody(assignTaskSchema),
  async (req: Request, res: Response) => {
    const task = await taskService.assign(req.params.id, req.body, req.user!.id);
    
    res.json({
      success: true,
      data: task,
      message: req.body.agentId ? 'Task assigned successfully' : 'Task unassigned successfully',
    });
  }
);

/**
 * POST /api/tasks/:id/start
 * Start a task
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
 * Complete a task
 */
router.post(
  '/:id/complete',
  validateParams(idParamSchema),
  validateBody(completeTaskSchema),
  async (req: Request, res: Response) => {
    const task = await taskService.complete(req.params.id, req.body, req.user!.id);
    
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
    const task = await taskService.fail(req.params.id, req.body, req.user!.id);
    
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
    message: 'Task retry initiated',
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
 * GET /api/tasks/:id/events
 * Get task events (audit trail)
 */
router.get('/:id/events', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const events = await taskService.getEvents(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: events,
  });
});

export default router;
