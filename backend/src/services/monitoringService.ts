import { prisma } from '../utils/prisma.js';
import { AgentStatus, EventType, EventLevel } from '@prisma/client';

export interface MonitoringStats {
  overview: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    errorAgents: number;
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
  };
  recentEvents: Array<{
    id: string;
    type: EventType;
    message: string;
    level: EventLevel;
    timestamp: Date;
    agentId: string | null;
    taskId: string | null;
    agent?: {
      id: string;
      name: string;
      status: AgentStatus;
    } | null;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId: string;
    timestamp: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  errorSummary: Array<{
    agentId: string;
    agentName: string;
    errorCount: number;
    lastError: string;
    lastErrorTime: Date;
  }>;
}

export interface AgentHealthMetrics {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  uptime: number | null;
  taskCompletionRate: number;
  errorRate: number;
  lastActivity: Date | null;
  confidenceScore: number;
  recentEvents: Array<{
    type: EventType;
    message: string;
    timestamp: Date;
    level: EventLevel;
  }>;
}

class MonitoringService {
  /**
   * Get comprehensive monitoring stats
   */
  async getStats(userId: string): Promise<MonitoringStats> {
    // Get all agents for this user
    const allAgents = await prisma.agent.findMany({
      where: { ownerId: userId },
      select: { id: true, status: true },
    });

    const totalAgents = allAgents.length;
    const activeAgents = allAgents.filter(a => a.status === AgentStatus.RUNNING).length;
    const idleAgents = allAgents.filter(a => a.status === AgentStatus.IDLE).length;
    const errorAgents = allAgents.filter(a => a.status === AgentStatus.ERROR).length;
    const userAgentIds = allAgents.map(a => a.id);

    // Get all tasks for this user
    const allTasks = await prisma.task.findMany({
      where: { createdById: userId },
      select: { status: true },
    });

    const totalTasks = allTasks.length;
    const runningTasks = allTasks.filter(t => t.status === 'RUNNING').length;
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
    const failedTasks = allTasks.filter(t => t.status === 'FAILED').length;

    // Get recent events (last 50)
    const recentEvents = await prisma.event.findMany({
      where: {
        agentId: { in: userAgentIds },
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    // Get recent audit logs (last 50)
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    // Get error summary
    const errorEvents = await prisma.event.findMany({
      where: {
        agentId: { in: userAgentIds },
        level: { in: [EventLevel.ERROR, EventLevel.CRITICAL] },
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Group errors by agent
    const errorMap = new Map<string, { agentName: string; errors: Array<{ message: string; timestamp: Date }> }>();
    
    errorEvents.forEach(event => {
      if (event.agent && event.agentId) {
        const existing = errorMap.get(event.agentId);
        if (existing) {
          existing.errors.push({ message: event.message, timestamp: event.timestamp });
        } else {
          errorMap.set(event.agentId, {
            agentName: event.agent.name,
            errors: [{ message: event.message, timestamp: event.timestamp }],
          });
        }
      }
    });

    const errorSummary = Array.from(errorMap.entries()).map(([agentId, data]) => ({
      agentId,
      agentName: data.agentName,
      errorCount: data.errors.length,
      lastError: data.errors[0].message,
      lastErrorTime: data.errors[0].timestamp,
    }));

    return {
      overview: {
        totalAgents,
        activeAgents,
        idleAgents,
        errorAgents,
        totalTasks,
        runningTasks,
        completedTasks,
        failedTasks,
      },
      recentEvents,
      recentAuditLogs,
      errorSummary,
    };
  }

  /**
   * Get health metrics for a specific agent
   */
  async getAgentHealth(agentId: string, userId: string): Promise<AgentHealthMetrics> {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, ownerId: userId },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Get agent's tasks
    const tasks = await prisma.task.findMany({
      where: { agentId },
    });

    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const failedTasks = tasks.filter(t => t.status === 'FAILED').length;
    const totalTasks = tasks.length;

    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const errorRate = totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0;

    // Calculate uptime (time since agent was started)
    const uptime = agent.status === AgentStatus.RUNNING ? 
      Date.now() - agent.updatedAt.getTime() : null;

    // Get recent events for this agent
    const recentEvents = await prisma.event.findMany({
      where: { agentId },
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: {
        type: true,
        message: true,
        timestamp: true,
        level: true,
      },
    });

    // Get last activity
    const lastEvent = recentEvents[0];
    const lastActivity = lastEvent ? lastEvent.timestamp : agent.updatedAt;

    // Calculate confidence score based on success rate and error rate
    const confidenceScore = Math.max(0, Math.min(100, taskCompletionRate - errorRate));

    return {
      agentId: agent.id,
      agentName: agent.name,
      status: agent.status,
      uptime,
      taskCompletionRate,
      errorRate,
      lastActivity,
      confidenceScore,
      recentEvents,
    };
  }

  /**
   * Get events filtered by type, level, and time range
   */
  async getEvents(
    userId: string,
    options: {
      agentId?: string;
      type?: EventType;
      level?: EventLevel;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ) {
    const { agentId, type, level, startDate, endDate, limit = 100 } = options;

    // Get user's agent IDs first
    const userAgents = await prisma.agent.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const userAgentIds = userAgents.map(a => a.id);

    const where: any = {
      agentId: { in: userAgentIds },
    };

    if (agentId) where.agentId = agentId;
    if (type) where.type = type;
    if (level) where.level = level;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return events;
  }

  /**
   * Get audit logs filtered by resource and time range
   */
  async getAuditLogs(
    userId: string,
    options: {
      resource?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ) {
    const { resource, action, startDate, endDate, limit = 100 } = options;

    const where: any = { userId };

    if (resource) where.resource = resource;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return logs;
  }
}

export const monitoringService = new MonitoringService();
