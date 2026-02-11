import { Router, Request, Response } from 'express';
import { monitoringService } from '../services/monitoringService.js';
import { authenticate } from '../middleware/auth.js';
import { validateParams } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();

// All monitoring routes require authentication
router.use(authenticate);

// Validation schemas
const idParamSchema = z.object({
  id: z.string().min(1),
});

const eventQuerySchema = z.object({
  agentId: z.string().optional(),
  type: z.string().optional(),
  level: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.coerce.number().optional(),
});

const auditLogQuerySchema = z.object({
  resource: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.coerce.number().optional(),
});

/**
 * GET /api/monitoring/stats
 * Get comprehensive monitoring statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  const stats = await monitoringService.getStats(req.user!.id);
  
  res.json({
    success: true,
    data: stats,
  });
});

/**
 * GET /api/monitoring/agents/:id/health
 * Get health metrics for a specific agent
 */
router.get(
  '/agents/:id/health',
  validateParams(idParamSchema),
  async (req: Request, res: Response) => {
    const health = await monitoringService.getAgentHealth(req.params.id, req.user!.id);
    
    res.json({
      success: true,
      data: health,
    });
  }
);

/**
 * GET /api/monitoring/events
 * Get events with optional filters
 */
router.get('/events', async (req: Request, res: Response) => {
  const parsed = eventQuerySchema.parse(req.query);
  const events = await monitoringService.getEvents(req.user!.id, parsed as any);
  
  res.json({
    success: true,
    data: events,
  });
});

/**
 * GET /api/monitoring/audit-logs
 * Get audit logs with optional filters
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  const parsed = auditLogQuerySchema.parse(req.query);
  const logs = await monitoringService.getAuditLogs(req.user!.id, parsed as any);
  
  res.json({
    success: true,
    data: logs,
  });
});

export default router;
