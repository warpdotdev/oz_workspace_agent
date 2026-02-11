import { Task, TaskStatus, TaskPriority, EventType, Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import type { CreateTaskInput, UpdateTaskInput } from '../utils/validation.js';
import type { InputJsonValue } from '@prisma/client/runtime/library';

// Task with relations
export type TaskWithRelations = Task & {
  agent: { id: string; name: string; status: string } | null;
  createdBy: { id: string; name: string | null; email: string };
  subtasks: { id: string; title: string; status: TaskStatus }[];
  _count: { events: number; subtasks: number };
};

// Query params for task listing
export interface TaskQueryParams {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  agentId?: string;
  search?: string;
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder: 'asc' | 'desc';
}

// Valid status transitions
const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.PENDING]: [TaskStatus.QUEUED, TaskStatus.RUNNING, TaskStatus.CANCELLED],
  [TaskStatus.QUEUED]: [TaskStatus.RUNNING, TaskStatus.CANCELLED],
  [TaskStatus.RUNNING]: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.PAUSED, TaskStatus.CANCELLED],
  [TaskStatus.PAUSED]: [TaskStatus.RUNNING, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.FAILED]: [TaskStatus.PENDING], // Allow retry
  [TaskStatus.CANCELLED]: [TaskStatus.PENDING], // Allow restart
};

/**
 * Task Management Service
 * Handles CRUD operations and lifecycle management for tasks
 */
export class TaskService {
  private includeRelations = {
    agent: { select: { id: true, name: true, status: true } },
    createdBy: { select: { id: true, name: true, email: true } },
    subtasks: { select: { id: true, title: true, status: true } },
    _count: { select: { events: true, subtasks: true } },
  };

  /**
   * Create a new task
   */
  async create(input: CreateTaskInput, createdById: string): Promise<TaskWithRelations> {
    // Validate agent exists if provided
    if (input.agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: input.agentId },
      });
      if (!agent) {
        throw new NotFoundError('Agent', input.agentId);
      }
    }

    // Validate parent task exists if provided
    if (input.parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: { id: input.parentTaskId },
      });
      if (!parentTask) {
        throw new NotFoundError('Parent Task', input.parentTaskId);
      }
    }

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        agentId: input.agentId,
        parentTaskId: input.parentTaskId,
        input: input.input as InputJsonValue,
        config: input.config as InputJsonValue,
        maxRetries: input.maxRetries,
        createdById,
      },
      include: this.includeRelations,
    });

    await this.logEvent(task.id, EventType.TASK_CREATED, 'Task created', task.agentId);

    return task;
  }

  /**
   * Get a task by ID
   */
  async getById(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await prisma.task.findFirst({
      where: { id, createdById: userId },
      include: this.includeRelations,
    });

    if (!task) {
      throw new NotFoundError('Task', id);
    }

    return task;
  }

  /**
   * List tasks with pagination and filtering
   */
  async list(params: TaskQueryParams, userId: string) {
    const { page, limit, status, priority, agentId, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      createdById: userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(agentId && { agentId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.TaskOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: this.includeRelations,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a task
   */
  async update(id: string, input: UpdateTaskInput, userId: string): Promise<TaskWithRelations> {
    const existing = await this.getById(id, userId);

    // Validate status transition if status is being changed
    if (input.status && input.status !== existing.status) {
      this.validateStatusTransition(existing.status, input.status);
    }

    // Validate agent exists if being changed
    if (input.agentId !== undefined && input.agentId !== null) {
      const agent = await prisma.agent.findFirst({ where: { id: input.agentId } });
      if (!agent) {
        throw new NotFoundError('Agent', input.agentId);
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        agentId: input.agentId,
        input: input.input as InputJsonValue | undefined,
        config: input.config as InputJsonValue | undefined,
        output: input.output as InputJsonValue | undefined,
        errorMessage: input.errorMessage,
        ...(input.status === TaskStatus.RUNNING && { startedAt: new Date() }),
        ...(input.status === TaskStatus.COMPLETED && { completedAt: new Date() }),
      },
      include: this.includeRelations,
    });

    return task;
  }

  /**
   * Delete a task
   */
  async delete(id: string, userId: string): Promise<void> {
    const task = await this.getById(id, userId);

    if (task.status === TaskStatus.RUNNING) {
      throw new BadRequestError('Cannot delete a running task. Cancel it first.');
    }

    await prisma.task.delete({ where: { id } });
  }

  /**
   * Start a task
   */
  async start(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);
    this.validateStatusTransition(task.status, TaskStatus.RUNNING);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.RUNNING,
        startedAt: new Date(),
      },
      include: this.includeRelations,
    });

    await this.logEvent(id, EventType.TASK_STARTED, 'Task started', task.agentId);

    return updated;
  }

  /**
   * Complete a task
   */
  async complete(
    id: string,
    userId: string,
    output?: Record<string, unknown>,
    confidenceScore?: number
  ): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);
    this.validateStatusTransition(task.status, TaskStatus.COMPLETED);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        output: output as InputJsonValue | undefined,
        confidenceScore,
        requiresReview: confidenceScore !== undefined && confidenceScore < 0.5,
      },
      include: this.includeRelations,
    });

    await this.logEvent(id, EventType.TASK_COMPLETED, 'Task completed', task.agentId);

    return updated;
  }

  /**
   * Fail a task
   */
  async fail(id: string, userId: string, errorMessage: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);
    this.validateStatusTransition(task.status, TaskStatus.FAILED);

    const shouldRetry = task.retryCount < task.maxRetries;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: shouldRetry ? TaskStatus.PENDING : TaskStatus.FAILED,
        errorMessage,
        retryCount: { increment: 1 },
        completedAt: shouldRetry ? undefined : new Date(),
      },
      include: this.includeRelations,
    });

    await this.logEvent(
      id,
      shouldRetry ? EventType.TASK_RETRYING : EventType.TASK_FAILED,
      shouldRetry ? `Task queued for retry (${updated.retryCount}/${task.maxRetries})` : `Task failed: ${errorMessage}`,
      task.agentId
    );

    return updated;
  }

  /**
   * Cancel a task
   */
  async cancel(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);
    this.validateStatusTransition(task.status, TaskStatus.CANCELLED);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.CANCELLED,
        completedAt: new Date(),
      },
      include: this.includeRelations,
    });

    await this.logEvent(id, EventType.TASK_CANCELLED, 'Task cancelled', task.agentId);

    return updated;
  }

  /**
   * Pause a task
   */
  async pause(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);
    this.validateStatusTransition(task.status, TaskStatus.PAUSED);

    const updated = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.PAUSED },
      include: this.includeRelations,
    });

    return updated;
  }

  /**
   * Resume a paused task
   */
  async resume(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status !== TaskStatus.PAUSED) {
      throw new BadRequestError('Only paused tasks can be resumed');
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.RUNNING },
      include: this.includeRelations,
    });

    await this.logEvent(id, EventType.TASK_STARTED, 'Task resumed', task.agentId);

    return updated;
  }

  /**
   * Assign a task to an agent
   */
  async assign(id: string, agentId: string | null, userId: string): Promise<TaskWithRelations> {
    await this.getById(id, userId);

    if (agentId) {
      const agent = await prisma.agent.findFirst({ where: { id: agentId } });
      if (!agent) {
        throw new NotFoundError('Agent', agentId);
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { agentId },
      include: this.includeRelations,
    });

    return updated;
  }

  /**
   * Get task statistics
   */
  async getStats(userId: string) {
    const [statusStats, priorityStats, total] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { createdById: userId },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { createdById: userId },
        _count: true,
      }),
      prisma.task.count({ where: { createdById: userId } }),
    ]);

    return {
      total,
      byStatus: statusStats.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityStats.reduce((acc, p) => {
        acc[p.priority] = p._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Get subtasks for a task
   */
  async getSubtasks(id: string, userId: string): Promise<TaskWithRelations[]> {
    await this.getById(id, userId);

    return prisma.task.findMany({
      where: { parentTaskId: id },
      include: this.includeRelations,
    });
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(from: TaskStatus, to: TaskStatus): void {
    const allowed = STATUS_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new BadRequestError(`Cannot transition task from ${from} to ${to}`);
    }
  }

  /**
   * Log an event
   */
  private async logEvent(
    taskId: string,
    type: EventType,
    message: string,
    agentId?: string | null
  ): Promise<void> {
    await prisma.event.create({
      data: {
        taskId,
        agentId,
        type,
        message,
        level: type.includes('FAILED') || type.includes('ERROR') ? 'ERROR' : 'INFO',
      },
    });
  }
}

export const taskService = new TaskService();
