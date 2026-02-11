import { Router, Request, Response } from 'express';
import { agentService } from '../services/agentService.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.js';
import {
  createAgentSchema,
  updateAgentSchema,
  agentQuerySchema,
  idParamSchema,
  createCapabilitySchema,
} from '../utils/validation.js';

const router = Router();

// All agent routes require authentication
router.use(authenticate);

/**
 * GET /api/agents
 * List agents with pagination and filtering
 */
router.get('/', validateQuery(agentQuerySchema), async (req: Request, res: Response) => {
  const result = await agentService.list(req.query as any, req.user!.id);
  
  res.json({
    success: true,
    data: result.agents,
    pagination: result.pagination,
  });
});

/**
 * POST /api/agents
 * Create a new agent
 */
router.post('/', validateBody(createAgentSchema), async (req: Request, res: Response) => {
  const agent = await agentService.create(req.body, req.user!.id);
  
  res.status(201).json({
    success: true,
    data: agent,
    message: 'Agent created successfully',
  });
});

/**
 * GET /api/agents/:id
 * Get an agent by ID
 */
router.get('/:id', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const agent = await agentService.getById(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: agent,
  });
});

/**
 * PUT /api/agents/:id
 * Update an agent
 */
router.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateAgentSchema),
  async (req: Request, res: Response) => {
    const agent = await agentService.update(req.params.id, req.body, req.user!.id);
    
    res.json({
      success: true,
      data: agent,
      message: 'Agent updated successfully',
    });
  }
);

/**
 * DELETE /api/agents/:id
 * Delete an agent
 */
router.delete('/:id', validateParams(idParamSchema), async (req: Request, res: Response) => {
  await agentService.delete(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    message: 'Agent deleted successfully',
  });
});

// Agent lifecycle management endpoints

/**
 * POST /api/agents/:id/start
 * Start an agent
 */
router.post('/:id/start', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const agent = await agentService.start(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: agent,
    message: 'Agent started successfully',
  });
});

/**
 * POST /api/agents/:id/stop
 * Stop an agent
 */
router.post('/:id/stop', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const agent = await agentService.stop(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: agent,
    message: 'Agent stopped successfully',
  });
});

/**
 * POST /api/agents/:id/pause
 * Pause an agent
 */
router.post('/:id/pause', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const agent = await agentService.pause(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: agent,
    message: 'Agent paused successfully',
  });
});

/**
 * POST /api/agents/:id/resume
 * Resume a paused agent
 */
router.post('/:id/resume', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const agent = await agentService.resume(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: agent,
    message: 'Agent resumed successfully',
  });
});

/**
 * GET /api/agents/:id/stats
 * Get agent statistics
 */
router.get('/:id/stats', validateParams(idParamSchema), async (req: Request, res: Response) => {
  const stats = await agentService.getStats(req.params.id, req.user!.id);
  
  res.json({
    success: true,
    data: stats,
  });
});

// Agent capabilities endpoints

/**
 * POST /api/agents/:id/capabilities
 * Add a capability to an agent
 */
router.post(
  '/:id/capabilities',
  validateParams(idParamSchema),
  validateBody(createCapabilitySchema),
  async (req: Request, res: Response) => {
    const capability = await agentService.addCapability(req.params.id, req.body, req.user!.id);
    
    res.status(201).json({
      success: true,
      data: capability,
      message: 'Capability added successfully',
    });
  }
);

/**
 * DELETE /api/agents/:id/capabilities/:capabilityId
 * Remove a capability from an agent
 */
router.delete('/:id/capabilities/:capabilityId', async (req: Request, res: Response) => {
  await agentService.removeCapability(req.params.id, req.params.capabilityId, req.user!.id);
  
  res.json({
    success: true,
    message: 'Capability removed successfully',
  });
});

export default router;
