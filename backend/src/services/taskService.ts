import { Task, TaskStatus, TaskPriority, EventType, Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import type { CreateTaskInput, UpdateTaskInput } from '../utils/validation.js';
import type { InputJsonValue } from '@prisma/client/runtime/library';

// Type for task with relations
export type TaskWithRelations = Task & {
  agent: { id: string; name: string; status: string } | null;
  createdBy: { id: string; name: string | null; email: string };
  subtasks: Task[];
  _count: { subtasks: number; events: number };
};

// Task query parameters
export interface TaskQueryParams {
  page: number;
  limit: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  agentId?: string;
  search?: string;
  parentTaskId?: string | null;
  sortBy: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title';
  sortOrder: 'asc' | 'desc';
}

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.PENDING]: [TaskStatus.QUEUED, TaskStatus.CANCELLED],
  [TaskStatus.QUEUED]: [TaskStatus.RUNNING, TaskStatus.CANCELLED],
  [TaskStatus.RUNNING]: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.PAUSED, TaskStatus.CANCELLED],
  [TaskStatus.PAUSED]: [TaskStatus.RUNNING, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [], // Terminal state
  [TaskStatus.FAILED]: [TaskStatus.QUEUED], // Can retry
  [TaskStatus.CANCELLED]: [], // Terminal state
};

/**
 * Task Service
 * Manages task lifecycle including creation, updates, status transitions, and assignment
 */
export class TaskService {
  /**
   * Create a new task
   */
  async create(input: CreateTaskInput, createdById: string): Promise<TaskWithRelations> {
    // Validate agent exists if provided
    if (input.agentId) {
      const agent = await prisma.agent.findUnique({ where: { id: input.agentId } });
      if (!agent) {
        throw new NotFoundError('Agent', input.agentId);
      }
    }

    // Validate parent task exists if provided
    if (input.parentTaskId) {
      const parentTask = await prisma.task.findUnique({ where: { id: input.parentTaskId } });
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
      include: this.getIncludeClause(),
    });

    // Log task creation event
    await this.logEvent(task.id, task.agentId, EventType.TASK_CREATED, 'Task created');

    return task;
  }

  /**
   * Get a task by ID
   */
  async getById(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await prisma.task.findFirst({
      where: { id, createdById: userId },
      include: this.getIncludeClause(),
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
    const { page, limit, status, priority, agentId, search, parentTaskId, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      createdById: userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(agentId && { agentId }),
      ...(parentTaskId !== undefined && { parentTaskId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build orderBy - handle priority sorting specially
    let orderBy: Prisma.TaskOrderByWithRelationInput;
    if (sortBy === 'priority') {
      // Priority order: CRITICAL > HIGH > MEDIUM > LOW
      orderBy = { priority: sortOrder };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Execute queries in parallel
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: this.getIncludeClause(),
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
    const existingTask = await this.getById(id, userId);

    // Validate status transition if status is being updated
    if (input.status && input.status !== existingTask.status) {
      this.validateStatusTransition(existingTask.status, input.status);
    }

    // Validate agent exists if being assigned
    if (input.agentId) {
      const agent = await prisma.agent.findUnique({ where: { id: input.agentId } });
      if (!agent) {
        throw new NotFoundError('Agent', input.agentId);
      }
    }

    // Prepare update data with timestamps
    const updateData: Prisma.TaskUpdateInput = {
      title: input.title,
      description: input.description,
      priority: input.priority,
      input: input.input as InputJsonValue | undefined,
      config: input.config as InputJsonValue | undefined,
      output: input.output as InputJsonValue | undefined,
      errorMessage: input.errorMessage,
    };

    // Handle agent assignment (including null to unassign)
    if (input.agentId !== undefined) {
      updateData.agent = input.agentId ? { connect: { id: input.agentId } } : { disconnect: true };
    }

    // Handle status updates with timestamps
    if (input.status) {
      updateData.status = input.status;
      
      if (input.status === TaskStatus.RUNNING && !existingTask.startedAt) {
        updateData.startedAt = new Date();
      }
      
      if (input.status === TaskStatus.COMPLETED || input.status === TaskStatus.FAILED || input.status === TaskStatus.CANCELLED) {
        updateData.completedAt = new Date();
      }

      if (input.status === TaskStatus.FAILED || input.status === TaskStatus.QUEUED) {
        // Increment retry count if retrying
        if (existingTask.status === TaskStatus.FAILED && input.status === TaskStatus.QUEUED) {
          if (existingTask.retryCount >= existingTask.maxRetries) {
            throw new BadRequestError(`Task has exceeded maximum retry attempts (${existingTask.maxRetries})`);
          }
          updateData.retryCount = { increment: 1 };
        }
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: this.getIncludeClause(),
    });

    // Log status change event
    if (input.status && input.status !== existingTask.status) {
      await this.logStatusChangeEvent(task.id, task.agentId, existingTask.status, input.status);
    }

    return task;
  }

  /**
   * Delete a task
   */
  async delete(id: string, userId: string): Promise<void> {
    // Verify task exists and belongs to user
    const task = await this.getById(id, userId);

    // Don't allow deletion of running tasks
    if (task.status === TaskStatus.RUNNING) {
      throw new BadRequestError('Cannot delete a running task. Cancel or complete it first.');
    }

    // Check for subtasks
    if (task._count.subtasks > 0) {
      throw new BadRequestError('Cannot delete task with subtasks. Delete subtasks first.');
    }

    await prisma.task.delete({ where: { id } });
  }

  /**
   * Start a task (transition to QUEUED then RUNNING)
   */
  async start(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.QUEUED) {
      throw new BadRequestError('Task must be in PENDING or QUEUED status to start');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.RUNNING,
        startedAt: new Date(),
      },
      include: this.getIncludeClause(),
    });

    await this.logEvent(id, task.agentId, EventType.TASK_STARTED, 'Task started');

    return updatedTask;
  }

  /**
   * Complete a task
   */
  async complete(id: string, userId: string, output?: Record<string, unknown>): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status !== TaskStatus.RUNNING) {
      throw new BadRequestError('Only running tasks can be completed');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        output: output as InputJsonValue | undefined,
      },
      include: this.getIncludeClause(),
    });

    await this.logEvent(id, task.agentId, EventType.TASK_COMPLETED, 'Task completed successfully');

    return updatedTask;
  }

  /**
   * Fail a task
   */
  async fail(id: string, userId: string, errorMessage: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status !== TaskStatus.RUNNING) {
      throw new BadRequestError('Only running tasks can be marked as failed');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.FAILED,
        completedAt: new Date(),
        errorMessage,
      },
      include: this.getIncludeClause(),
    });

    await this.logEvent(id, task.agentId, EventType.TASK_FAILED, `Task failed: ${errorMessage}`);

    return updatedTask;
  }

  /**
   * Cancel a task
   */
  async cancel(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    const validCancelStates: TaskStatus[] = [TaskStatus.PENDING, TaskStatus.QUEUED, TaskStatus.RUNNING, TaskStatus.PAUSED];
    if (!validCancelStates.includes(task.status)) {
      throw new BadRequestError('Cannot cancel a task that is already completed, failed, or cancelled');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.CANCELLED,
        completedAt: new Date(),
      },
      include: this.getIncludeClause(),
    });

    await this.logEvent(id, task.agentId, EventType.TASK_CANCELLED, 'Task cancelled');

    return updatedTask;
  }

  /**
   * Retry a failed task
   */
  async retry(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status !== TaskStatus.FAILED) {
      throw new BadRequestError('Only failed tasks can be retried');
    }

    if (task.retryCount >= task.maxRetries) {
      throw new BadRequestError(`Task has exceeded maximum retry attempts (${task.maxRetries})`);
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.QUEUED,
        retryCount: { increment: 1 },
        errorMessage: null,
        completedAt: null,
      },
      include: this.getIncludeClause(),
    });

    await this.logEvent(id, task.agentId, EventType.TASK_RETRYING, `Task retry attempt ${updatedTask.retryCount}`);

    return updatedTask;
  }

  /**
   * Pause a running task
   */
  async pause(id: string, userId: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, userId);

    if (task.status !== TaskStatus.RUNNING) {
      throw new BadRequestError('Only running tasks can be paused');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.PAUSED },
      include: this.getIncludeClause(),
    });

    await this.logEvent(id, task.agentId, EventType.TASK_CANCELLED, 'Task paused'); // Using CANCELLED as there's no PAUSED event

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
      data: { status: TaskStatus.RUNNING },
      include: this.getIncludeClause(),
    });

    await this.logEvent(id, task.agentId, EventType.TASK_STARTED, 'Task resumed');

    return updatedTask;
  }

  /**
   * Assign a task to an agent
   */
  async assign(id: string, agentId: string | null, userId: string): Promise<TaskWithRelations> {
    await this.getById(id, userId);

    // Validate agent exists if being assigned
    if (agentId) {
      const agent = await prisma.agent.findUnique({ where: { id: agentId } });
      if (!agent) {
        throw new NotFoundError('Agent', agentId);
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        agent: agentId ? { connect: { id: agentId } } : { disconnect: true },
      },
      include: this.getIncludeClause(),
    });

    const message = agentId 
      ? `Task assigned to agent ${updatedTask.agent?.name || agentId}`
      : 'Task unassigned';
    await this.logEvent(id, agentId, EventType.TASK_CREATED, message);

    return updatedTask;
  }

  /**
   * Get task statistics for a user
   */
  async getStats(userId: string) {
    const [statusStats, priorityStats, recentTasks, overdueTasks] = await Promise.all([
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
      prisma.task.findMany({
        where: { createdById: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, priority: true, createdAt: true },
      }),
      prisma.task.count({
        where: {
          createdById: userId,
          status: { in: [TaskStatus.PENDING, TaskStatus.QUEUED, TaskStatus.RUNNING] },
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
        },
      }),
    ]);

    return {
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat.priority] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      recentTasks,
      overdueCount: overdueTasks,
      total: statusStats.reduce((sum, stat) => sum + stat._count, 0),
    };
  }

  /**
   * Get task events/history
   */
  async getEvents(id: string, userId: string, limit: number = 20) {
    await this.getById(id, userId);

    const events = await prisma.event.findMany({
      where: { taskId: id },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return events;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(from: TaskStatus, to: TaskStatus): void {
    const validTransitions = VALID_STATUS_TRANSITIONS[from];
    if (!validTransitions.includes(to)) {
      throw new BadRequestError(
        `Invalid status transition from ${from} to ${to}. Valid transitions: ${validTransitions.join(', ') || 'none'}`
      );
    }
  }

  /**
   * Log status change event
   */
  private async logStatusChangeEvent(
    taskId: string, 
    agentId: string | null, 
    fromStatus: TaskStatus, 
    toStatus: TaskStatus
  ): Promise<void> {
    const eventTypeMap: Partial<Record<TaskStatus, EventType>> = {
      [TaskStatus.RUNNING]: EventType.TASK_STARTED,
      [TaskStatus.COMPLETED]: EventType.TASK_COMPLETED,
      [TaskStatus.FAILED]: EventType.TASK_FAILED,
      [TaskStatus.CANCELLED]: EventType.TASK_CANCELLED,
      [TaskStatus.QUEUED]: EventType.TASK_RETRYING,
    };

    const eventType = eventTypeMap[toStatus] || EventType.SYSTEM_INFO;
    await this.logEvent(taskId, agentId, eventType, `Task status changed from ${fromStatus} to ${toStatus}`);
  }

  /**
   * Log an event for a task
   */
  private async logEvent(
    taskId: string, 
    agentId: string | null, 
    type: EventType, 
    message: string, 
    data: Record<string, unknown> = {}
  ): Promise<void> {
    await prisma.event.create({
      data: {
        taskId,
        agentId,
        type,
        message,
        data: data as InputJsonValue,
        level: type.includes('ERROR') || type.includes('FAILED') ? 'ERROR' : 'INFO',
      },
    });
  }

  /**
   * Get include clause for task queries
   */
  private getIncludeClause() {
    return {
      agent: {
        select: { id: true, name: true, status: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      subtasks: true,
      _count: {
        select: { subtasks: true, events: true },
      },
    };
  }
}

// Export singleton instance
export const taskService = new TaskService();
