import { Task, TaskStatus, TaskPriority, EventType, Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import type { CreateTaskInput, UpdateTaskInput } from '../utils/validation.js';
import type { InputJsonValue } from '@prisma/client/runtime/library';

// Task query parameters interface
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

// Type for task with relations
export type TaskWithRelations = Task & {
  agent: { id: string; name: string; status: string } | null;
  createdBy: { id: string; name: string | null; email: string };
  _count: { subtasks: number; events: number };
};

/**
 * Task Management Service
 * Handles task CRUD operations, status transitions, and assignment
 */
export class TaskService {
  /**
   * Create a new task
   */
  async create(input: CreateTaskInput, createdById: string): Promise<TaskWithRelations> {
    // If agentId provided, verify it exists and belongs to user
    if (input.agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: input.agentId, ownerId: createdById },
      });
      if (!agent) {
        throw new NotFoundError('Agent', input.agentId);
      }
    }

    // If parentTaskId provided, verify it exists
    if (input.parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: { id: input.parentTaskId, createdById },
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
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
    });

    // Log task creation event
    await this.logEvent(task.id, EventType.TASK_CREATED, 'Task created');

    return task;
  }

  /**
   * Get a task by ID
   */
  async getById(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await prisma.task.findFirst({
      where: { id, createdById: userId },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
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

    // Build where clause
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

    // Build orderBy - map priority and status to proper sorting
    let orderBy: Prisma.TaskOrderByWithRelationInput;
    if (sortBy === 'priority') {
      // Custom order for priority: CRITICAL > HIGH > MEDIUM > LOW
      orderBy = { priority: sortOrder };
    } else if (sortBy === 'status') {
      orderBy = { status: sortOrder };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Execute queries in parallel
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true, status: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { subtasks: true, events: true } },
        },
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
    // Verify task exists and belongs to user
    await this.getById(id, userId);

    // If assigning to agent, verify agent exists
    if (input.agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: input.agentId, ownerId: userId },
      });
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
        // Update timestamps based on status
        ...(input.status === TaskStatus.RUNNING && { startedAt: new Date() }),
        ...(input.status === TaskStatus.COMPLETED && { completedAt: new Date() }),
        ...(input.status === TaskStatus.FAILED && { completedAt: new Date() }),
      },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
    });

    return task;
  }

  /**
   * Delete a task
   */
  async delete(id: string, userId: string): Promise<void> {
    const task = await this.getById(id, userId);

    // Check if task has running subtasks
    const runningSubtasks = await prisma.task.count({
      where: {
        parentTaskId: id,
        status: { in: [TaskStatus.RUNNING, TaskStatus.QUEUED] },
      },
    });

    if (runningSubtasks > 0) {
      throw new BadRequestError('Cannot delete task with running subtasks');
    }

    await prisma.task.delete({ where: { id: task.id } });
  }

  /**
   * Start a task
   */
  async start(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status === TaskStatus.RUNNING) {
      throw new BadRequestError('Task is already running');
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new BadRequestError('Cannot start a completed or cancelled task');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.RUNNING,
        startedAt: new Date(),
      },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
    });

    await this.logEvent(id, EventType.TASK_STARTED, 'Task started');

    return updatedTask;
  }

  /**
   * Complete a task
   */
  async complete(id: string, output: Record<string, unknown>, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status !== TaskStatus.RUNNING) {
      throw new BadRequestError('Only running tasks can be completed');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        output: output as InputJsonValue,
        completedAt: new Date(),
      },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
    });

    await this.logEvent(id, EventType.TASK_COMPLETED, 'Task completed');

    return updatedTask;
  }

  /**
   * Fail a task
   */
  async fail(id: string, errorMessage: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status !== TaskStatus.RUNNING) {
      throw new BadRequestError('Only running tasks can be marked as failed');
    }

    // Check if we should retry
    const shouldRetry = task.retryCount < task.maxRetries;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: shouldRetry
        ? {
            status: TaskStatus.PENDING,
            retryCount: task.retryCount + 1,
            errorMessage,
          }
        : {
            status: TaskStatus.FAILED,
            errorMessage,
            completedAt: new Date(),
          },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
    });

    await this.logEvent(
      id,
      shouldRetry ? EventType.TASK_RETRYING : EventType.TASK_FAILED,
      shouldRetry ? `Task failed, retrying (${task.retryCount + 1}/${task.maxRetries})` : 'Task failed'
    );

    return updatedTask;
  }

  /**
   * Cancel a task
   */
  async cancel(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new BadRequestError('Task is already completed or cancelled');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.CANCELLED,
        completedAt: new Date(),
      },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
    });

    await this.logEvent(id, EventType.TASK_CANCELLED, 'Task cancelled');

    return updatedTask;
  }

  /**
   * Pause a task
   */
  async pause(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status !== TaskStatus.RUNNING) {
      throw new BadRequestError('Only running tasks can be paused');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.PAUSED,
      },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
    });

    return updatedTask;
  }

  /**
   * Resume a paused task
   */
  async resume(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status !== TaskStatus.PAUSED) {
      throw new BadRequestError('Only paused tasks can be resumed');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.RUNNING,
      },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
    });

    return updatedTask;
  }

  /**
   * Assign task to an agent
   */
  async assign(id: string, agentId: string | null, userId: string): Promise<TaskWithRelations> {
    await this.getById(id, userId);

    // If assigning to agent, verify agent exists
    if (agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: agentId, ownerId: userId },
      });
      if (!agent) {
        throw new NotFoundError('Agent', agentId);
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { agentId },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
    });

    return updatedTask;
  }

  /**
   * Get subtasks for a task
   */
  async getSubtasks(id: string, userId: string) {
    await this.getById(id, userId);

    return prisma.task.findMany({
      where: { parentTaskId: id },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true, events: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get task events
   */
  async getEvents(id: string, userId: string) {
    await this.getById(id, userId);

    return prisma.event.findMany({
      where: { taskId: id },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  /**
   * Get task statistics for a user
   */
  async getStats(userId: string) {
    const stats = await prisma.task.groupBy({
      by: ['status'],
      where: { createdById: userId },
      _count: true,
    });

    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      where: { createdById: userId },
      _count: true,
    });

    return {
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat.priority] = stat._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Log an event for a task
   */
  private async logEvent(taskId: string, type: EventType, message: string, data: Record<string, unknown> = {}) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    
    await prisma.event.create({
      data: {
        taskId,
        agentId: task?.agentId,
        type,
        message,
        data: data as InputJsonValue,
        level: type.includes('FAILED') ? 'ERROR' : 'INFO',
      },
    });
  }
}

// Export singleton instance
export const taskService = new TaskService();
