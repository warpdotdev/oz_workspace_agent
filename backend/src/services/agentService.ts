import { Agent, AgentStatus, EventType, Prisma, AgentCapability } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import type { CreateAgentInput, UpdateAgentInput, AgentQueryParams } from '../utils/validation.js';
import type { InputJsonValue } from '@prisma/client/runtime/library';

// Type for agent with relations
export type AgentWithRelations = Agent & {
  capabilities: Pick<AgentCapability, 'id' | 'name' | 'description' | 'config' | 'enabled'>[];
  _count: { tasks: number; events: number };
};

/**
 * Agent Registry Service
 * Manages the lifecycle of AI agents including creation, updates, status management, and deletion
 */
export class AgentService {
  /**
   * Create a new agent
   */
  async create(input: CreateAgentInput, ownerId: string): Promise<AgentWithRelations> {
    const { capabilities, ...agentData } = input;

    const agent = await prisma.agent.create({
      data: {
        name: agentData.name,
        description: agentData.description,
        type: agentData.type,
        framework: agentData.framework,
        version: agentData.version,
        config: agentData.config as InputJsonValue,
        metadata: agentData.metadata as InputJsonValue,
        ownerId,
        capabilities: capabilities ? {
          create: capabilities.map(cap => ({
            name: cap.name,
            description: cap.description,
            config: cap.config as InputJsonValue,
            enabled: cap.enabled,
          })),
        } : undefined,
      },
      include: {
        capabilities: {
          select: { id: true, name: true, description: true, config: true, enabled: true },
        },
        _count: {
          select: { tasks: true, events: true },
        },
      },
    });

    // Log agent creation event
    await this.logEvent(agent.id, EventType.AGENT_STARTED, 'Agent created');

    return agent;
  }

  /**
   * Get an agent by ID
   */
  async getById(id: string, ownerId: string): Promise<AgentWithRelations> {
    const agent = await prisma.agent.findFirst({
      where: { id, ownerId },
      include: {
        capabilities: {
          select: { id: true, name: true, description: true, config: true, enabled: true },
        },
        _count: {
          select: { tasks: true, events: true },
        },
      },
    });

    if (!agent) {
      throw new NotFoundError('Agent', id);
    }

    return agent;
  }

  /**
   * List agents with pagination and filtering
   */
  async list(params: AgentQueryParams, ownerId: string) {
    const { page, limit, status, type, framework, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.AgentWhereInput = {
      ownerId,
      ...(status && { status }),
      ...(type && { type }),
      ...(framework && { framework }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build orderBy
    const orderBy: Prisma.AgentOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Execute queries in parallel
    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          capabilities: {
            select: { id: true, name: true, description: true, config: true, enabled: true },
          },
          _count: {
            select: { tasks: true, events: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.agent.count({ where }),
    ]);

    return {
      agents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update an agent
   */
  async update(id: string, input: UpdateAgentInput, ownerId: string): Promise<AgentWithRelations> {
    // Verify agent exists and belongs to user
    await this.getById(id, ownerId);

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        status: input.status,
        framework: input.framework,
        version: input.version,
        config: input.config as InputJsonValue | undefined,
        metadata: input.metadata as InputJsonValue | undefined,
        ...(input.status === AgentStatus.RUNNING && { lastActiveAt: new Date() }),
      },
      include: {
        capabilities: {
          select: { id: true, name: true, description: true, config: true, enabled: true },
        },
        _count: {
          select: { tasks: true, events: true },
        },
      },
    });

    // Log config update if config changed
    if (input.config) {
      await this.logEvent(id, EventType.AGENT_CONFIG_UPDATED, 'Agent configuration updated');
    }

    return agent;
  }

  /**
   * Delete an agent
   */
  async delete(id: string, ownerId: string): Promise<void> {
    // Verify agent exists and belongs to user
    const agent = await this.getById(id, ownerId);

    // Check if agent has running tasks
    const runningTasks = await prisma.task.count({
      where: {
        agentId: id,
        status: { in: ['RUNNING', 'QUEUED'] },
      },
    });

    if (runningTasks > 0) {
      throw new BadRequestError('Cannot delete agent with running tasks. Stop all tasks first.');
    }

    // Log termination before deletion
    await this.logEvent(id, EventType.AGENT_STOPPED, 'Agent terminated');

    await prisma.agent.delete({ where: { id: agent.id } });
  }

  /**
   * Start an agent
   */
  async start(id: string, ownerId: string): Promise<AgentWithRelations> {
    const agent = await this.getById(id, ownerId);

    if (agent.status === AgentStatus.RUNNING) {
      throw new BadRequestError('Agent is already running');
    }

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: {
        status: AgentStatus.RUNNING,
        lastActiveAt: new Date(),
      },
      include: {
        capabilities: {
          select: { id: true, name: true, description: true, config: true, enabled: true },
        },
        _count: {
          select: { tasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.AGENT_STARTED, 'Agent started');

    return updatedAgent;
  }

  /**
   * Stop an agent
   */
  async stop(id: string, ownerId: string): Promise<AgentWithRelations> {
    const agent = await this.getById(id, ownerId);

    if (agent.status !== AgentStatus.RUNNING && agent.status !== AgentStatus.PAUSED) {
      throw new BadRequestError('Agent is not running');
    }

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: {
        status: AgentStatus.IDLE,
      },
      include: {
        capabilities: {
          select: { id: true, name: true, description: true, config: true, enabled: true },
        },
        _count: {
          select: { tasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.AGENT_STOPPED, 'Agent stopped');

    return updatedAgent;
  }

  /**
   * Pause an agent
   */
  async pause(id: string, ownerId: string): Promise<AgentWithRelations> {
    const agent = await this.getById(id, ownerId);

    if (agent.status !== AgentStatus.RUNNING) {
      throw new BadRequestError('Only running agents can be paused');
    }

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: {
        status: AgentStatus.PAUSED,
      },
      include: {
        capabilities: {
          select: { id: true, name: true, description: true, config: true, enabled: true },
        },
        _count: {
          select: { tasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.AGENT_STOPPED, 'Agent paused');

    return updatedAgent;
  }

  /**
   * Resume a paused agent
   */
  async resume(id: string, ownerId: string): Promise<AgentWithRelations> {
    const agent = await this.getById(id, ownerId);

    if (agent.status !== AgentStatus.PAUSED) {
      throw new BadRequestError('Only paused agents can be resumed');
    }

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: {
        status: AgentStatus.RUNNING,
        lastActiveAt: new Date(),
      },
      include: {
        capabilities: {
          select: { id: true, name: true, description: true, config: true, enabled: true },
        },
        _count: {
          select: { tasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.AGENT_STARTED, 'Agent resumed');

    return updatedAgent;
  }

  /**
   * Get agent statistics
   */
  async getStats(id: string, ownerId: string) {
    const agent = await this.getById(id, ownerId);

    const [taskStats, recentEvents] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { agentId: id },
        _count: true,
      }),
      prisma.event.findMany({
        where: { agentId: id },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ]);

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status,
        successRate: agent.successRate,
        avgLatency: agent.avgLatency,
        totalRuns: agent.totalRuns,
      },
      taskStats: taskStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      recentEvents,
    };
  }

  /**
   * Add a capability to an agent
   */
  async addCapability(
    agentId: string,
    capability: { name: string; description?: string; config?: Record<string, unknown>; enabled?: boolean },
    ownerId: string
  ) {
    await this.getById(agentId, ownerId);

    return prisma.agentCapability.create({
      data: {
        agentId,
        name: capability.name,
        description: capability.description,
        config: (capability.config || {}) as InputJsonValue,
        enabled: capability.enabled ?? true,
      },
    });
  }

  /**
   * Remove a capability from an agent
   */
  async removeCapability(agentId: string, capabilityId: string, ownerId: string) {
    await this.getById(agentId, ownerId);

    await prisma.agentCapability.delete({
      where: { id: capabilityId, agentId },
    });
  }

  /**
   * Log an event for an agent
   */
  private async logEvent(agentId: string, type: EventType, message: string, data: Record<string, unknown> = {}) {
    await prisma.event.create({
      data: {
        agentId,
        type,
        message,
        data: data as InputJsonValue,
        level: type.includes('ERROR') ? 'ERROR' : 'INFO',
      },
    });
  }
}

// Export singleton instance
export const agentService = new AgentService();
