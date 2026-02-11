import { Task, TaskStatus, EventType, Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryParams,
  AssignTaskInput,
  CompleteTaskInput,
  FailTaskInput,
} from '../utils/validation.js';
import type { InputJsonValue } from '@prisma/client/runtime/library';

// Type for task with relations
export type TaskWithRelations = Task & {
  agent: { id: string; name: string; type: string; status: string } | null;
  createdBy: { id: string; name: string | null; email: string };
  parentTask: { id: string; title: string } | null;
  _count: { subtasks: number; events: number };
};

// Valid status transitions
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: [TaskStatus.QUEUED, TaskStatus.RUNNING, TaskStatus.CANCELLED],
  QUEUED: [TaskStatus.RUNNING, TaskStatus.CANCELLED],
  RUNNING: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.PAUSED, TaskStatus.CANCELLED],
  PAUSED: [TaskStatus.RUNNING, TaskStatus.CANCELLED],
  COMPLETED: [], // Terminal state
  FAILED: [TaskStatus.PENDING, TaskStatus.CANCELLED], // Can retry
  CANCELLED: [], // Terminal state
};

/**
 * Task Management Service
 * Manages task lifecycle including creation, assignment, execution, and completion
 */
export class TaskService {
  /**
   * Create a new task
   */
  async create(input: CreateTaskInput, createdById: string): Promise<TaskWithRelations> {
    // Validate parent task exists if provided
    if (input.parentTaskId) {
      const parentTask = await prisma.task.findFirst({
        where: { id: input.parentTaskId, createdById },
      });
      if (!parentTask) {
        throw new NotFoundError('Parent task', input.parentTaskId);
      }
    }

    // Validate agent exists if provided
    if (input.agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: input.agentId, ownerId: createdById },
      });
      if (!agent) {
        throw new NotFoundError('Agent', input.agentId);
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
        requiresReview: input.requiresReview,
        createdById,
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
      },
    });

    // Log task creation event
    await this.logEvent(task.id, EventType.TASK_CREATED, `Task created: ${task.title}`);

    return task;
  }

  /**
   * Get a task by ID
   */
  async getById(id: string, createdById: string): Promise<TaskWithRelations> {
    const task = await prisma.task.findFirst({
      where: { id, createdById },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
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
  async list(params: TaskQueryParams, createdById: string) {
    const { page, limit, status, priority, agentId, requiresReview, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      createdById,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(agentId && { agentId }),
      ...(requiresReview !== undefined && { requiresReview }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build orderBy
    const orderBy: Prisma.TaskOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Execute queries in parallel
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          agent: {
            select: { id: true, name: true, type: true, status: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          parentTask: {
            select: { id: true, title: true },
          },
          _count: {
            select: { subtasks: true, events: true },
          },
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
  async update(id: string, input: UpdateTaskInput, createdById: string): Promise<TaskWithRelations> {
    const existingTask = await this.getById(id, createdById);

    // Validate status transition if status is being changed
    if (input.status && input.status !== existingTask.status) {
      this.validateStatusTransition(existingTask.status, input.status);
    }

    // Validate agent exists if being changed
    if (input.agentId !== undefined) {
      if (input.agentId) {
        const agent = await prisma.agent.findFirst({
          where: { id: input.agentId, ownerId: createdById },
        });
        if (!agent) {
          throw new NotFoundError('Agent', input.agentId);
        }
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
        confidenceScore: input.confidenceScore,
        reasoning: input.reasoning,
        requiresReview: input.requiresReview,
        ...(input.status === TaskStatus.RUNNING && !existingTask.startedAt && { startedAt: new Date() }),
        ...(input.status === TaskStatus.COMPLETED && !existingTask.completedAt && { completedAt: new Date() }),
        ...(input.status === TaskStatus.FAILED && !existingTask.completedAt && { completedAt: new Date() }),
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
      },
    });

    // Log status change event if status changed
    if (input.status && input.status !== existingTask.status) {
      await this.logEvent(id, this.getEventTypeForStatus(input.status), `Task status changed to ${input.status}`);
    }

    return task;
  }

  /**
   * Delete a task
   */
  async delete(id: string, createdById: string): Promise<void> {
    const task = await this.getById(id, createdById);

    // Don't allow deletion of running tasks
    if (task.status === TaskStatus.RUNNING) {
      throw new BadRequestError('Cannot delete a running task. Cancel or complete it first.');
    }

    await this.logEvent(id, EventType.TASK_CANCELLED, 'Task deleted');
    await prisma.task.delete({ where: { id } });
  }

  /**
   * Assign or unassign a task to an agent
   */
  async assign(id: string, input: AssignTaskInput, createdById: string): Promise<TaskWithRelations> {
    // Verify task exists and belongs to user
    await this.getById(id, createdById);

    // Validate agent exists if assigning
    if (input.agentId) {
      const agent = await prisma.agent.findFirst({
        where: { id: input.agentId, ownerId: createdById },
      });
      if (!agent) {
        throw new NotFoundError('Agent', input.agentId);
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        agentId: input.agentId,
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
      },
    });

    const message = input.agentId
      ? `Task assigned to agent ${updatedTask.agent?.name}`
      : 'Task unassigned from agent';
    await this.logEvent(id, EventType.SYSTEM_INFO, message);

    return updatedTask;
  }

  /**
   * Start a task
   */
  async start(id: string, createdById: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, createdById);

    if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.QUEUED) {
      throw new BadRequestError('Only pending or queued tasks can be started');
    }

    if (!task.agentId) {
      throw new BadRequestError('Cannot start task without an assigned agent');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.RUNNING,
        startedAt: new Date(),
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.TASK_STARTED, 'Task started');

    return updatedTask;
  }

  /**
   * Complete a task
   */
  async complete(id: string, input: CompleteTaskInput, createdById: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, createdById);

    if (task.status !== TaskStatus.RUNNING) {
      throw new BadRequestError('Only running tasks can be completed');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        output: input.output as InputJsonValue | undefined,
        confidenceScore: input.confidenceScore,
        reasoning: input.reasoning,
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.TASK_COMPLETED, 'Task completed successfully');

    return updatedTask;
  }

  /**
   * Mark a task as failed
   */
  async fail(id: string, input: FailTaskInput, createdById: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, createdById);

    if (task.status !== TaskStatus.RUNNING) {
      throw new BadRequestError('Only running tasks can be marked as failed');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.FAILED,
        completedAt: new Date(),
        errorMessage: input.errorMessage,
        reasoning: input.reasoning,
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.TASK_FAILED, `Task failed: ${input.errorMessage}`);

    return updatedTask;
  }

  /**
   * Cancel a task
   */
  async cancel(id: string, createdById: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, createdById);

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new BadRequestError('Cannot cancel a completed or already cancelled task');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.CANCELLED,
        completedAt: new Date(),
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.TASK_CANCELLED, 'Task cancelled');

    return updatedTask;
  }

  /**
   * Retry a failed task
   */
  async retry(id: string, createdById: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, createdById);

    if (task.status !== TaskStatus.FAILED) {
      throw new BadRequestError('Only failed tasks can be retried');
    }

    if (task.retryCount >= task.maxRetries) {
      throw new BadRequestError(`Task has reached maximum retry limit (${task.maxRetries})`);
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.PENDING,
        retryCount: task.retryCount + 1,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.TASK_RETRYING, `Task retry attempt ${updatedTask.retryCount}/${task.maxRetries}`);

    return updatedTask;
  }

  /**
   * Pause a running task
   */
  async pause(id: string, createdById: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, createdById);

    if (task.status !== TaskStatus.RUNNING) {
      throw new BadRequestError('Only running tasks can be paused');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.PAUSED,
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.SYSTEM_INFO, 'Task paused');

    return updatedTask;
  }

  /**
   * Resume a paused task
   */
  async resume(id: string, createdById: string): Promise<TaskWithRelations> {
    const task = await this.getById(id, createdById);

    if (task.status !== TaskStatus.PAUSED) {
      throw new BadRequestError('Only paused tasks can be resumed');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.RUNNING,
      },
      include: {
        agent: {
          select: { id: true, name: true, type: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        _count: {
          select: { subtasks: true, events: true },
        },
      },
    });

    await this.logEvent(id, EventType.SYSTEM_INFO, 'Task resumed');

    return updatedTask;
  }

  /**
   * Get task events (audit trail)
   */
  async getEvents(id: string, createdById: string) {
    // Verify task exists and belongs to user
    await this.getById(id, createdById);

    return prisma.event.findMany({
      where: { taskId: id },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get task statistics
   */
  async getStats(createdById: string) {
    const [statusStats, priorityStats] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { createdById },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { createdById },
        _count: true,
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
    };
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: TaskStatus, newStatus: TaskStatus): void {
    const validTransitions = VALID_TRANSITIONS[currentStatus];
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions.join(', ')}`
      );
    }
  }

  /**
   * Get event type for status change
   */
  private getEventTypeForStatus(status: TaskStatus): EventType {
    const mapping: Record<TaskStatus, EventType> = {
      PENDING: EventType.TASK_CREATED,
      QUEUED: EventType.TASK_CREATED,
      RUNNING: EventType.TASK_STARTED,
      COMPLETED: EventType.TASK_COMPLETED,
      FAILED: EventType.TASK_FAILED,
      CANCELLED: EventType.TASK_CANCELLED,
      PAUSED: EventType.SYSTEM_INFO,
    };
    return mapping[status];
  }

  /**
   * Log an event for a task
   */
  private async logEvent(taskId: string, type: EventType, message: string, data: Record<string, unknown> = {}) {
    await prisma.event.create({
      data: {
        taskId,
        type,
        message,
        data: data as InputJsonValue,
        level: type.includes('ERROR') || type === EventType.TASK_FAILED ? 'ERROR' : 'INFO',
      },
    });
  }
}

// Export singleton instance
export const taskService = new TaskService();
