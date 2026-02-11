import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { CreateAgentRequest, UpdateAgentRequest } from '@ai-agent-platform/shared';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// Create agent
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      name,
      description,
      systemPrompt,
      model,
      temperature,
      capabilities = [],
      guardrails = [],
    } = req.body as CreateAgentRequest;

    // Validate required fields
    if (!name || !description || !systemPrompt || !model || temperature === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, systemPrompt, model, temperature',
      });
    }

    // Validate temperature range
    if (temperature < 0 || temperature > 1) {
      return res.status(400).json({ error: 'Temperature must be between 0 and 1' });
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        systemPrompt,
        model,
        temperature,
        capabilities,
        guardrails,
        createdBy: req.user!.userId,
      },
    });

    res.status(201).json(agent);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all agents for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: {
        createdBy: req.user!.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single agent by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: {
            assignedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Check ownership
    if (agent.createdBy !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(agent);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update agent
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body as UpdateAgentRequest;

    // Validate temperature if provided
    if (updates.temperature !== undefined && (updates.temperature < 0 || updates.temperature > 1)) {
      return res.status(400).json({ error: 'Temperature must be between 0 and 1' });
    }

    // Check if agent exists and user owns it
    const existingAgent = await prisma.agent.findUnique({
      where: { id },
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (existingAgent.createdBy !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update agent
    const agent = await prisma.agent.update({
      where: { id },
      data: updates,
    });

    res.json(agent);
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete agent
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if agent exists and user owns it
    const existingAgent = await prisma.agent.findUnique({
      where: { id },
    });

    if (!existingAgent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    if (existingAgent.createdBy !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete agent (cascade will delete related tasks, executions, etc.)
    await prisma.agent.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
