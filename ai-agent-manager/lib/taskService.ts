import { db } from './db';

// Using any types until Prisma client is generated
export type TaskWithRelations = any;

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  projectId?: string;
  assigneeId?: string;
  agentId?: string;
  dueDate?: Date | string;
  confidenceScore?: number;
  reasoningLog?: Record<string, unknown>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assigneeId?: string;
  agentId?: string;
  dueDate?: Date | string | null;
  confidenceScore?: number;
  reasoningLog?: Record<string, unknown>;
}

export interface TaskQueryParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  assigneeId?: string;
  agentId?: string;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Task Management Service
 * Handles CRUD operations and business logic for tasks
 */
export class TaskService {
  /**
   * Create a new task
   */
  async create(input: CreateTaskInput, createdById: string): Promise<TaskWithRelations> {
    const task = await db.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status || TaskStatus.TODO,
        priority: input.priority || TaskPriority.MEDIUM,
        projectId: input.projectId,
        assigneeId: input.assigneeId,
        agentId: input.agentId,
        createdById,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        confidenceScore: input.confidenceScore,
        reasoningLog: input.reasoningLog,
      },
      include: {
        agent: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return task;
  }

  /**
   * Get a task by ID
   */
  async getById(id: string, userId?: string): Promise<TaskWithRelations | null> {
    const where: any = { id };
    
    // Optional: Add user filtering if you want users to only see their tasks
    // if (userId) {
    //   where.OR = [
    //     { createdById: userId },
    //     { assigneeId: userId },
    //   ];
    // }

    const task = await db.task.findFirst({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return task;
  }

  /**
   * List tasks with pagination and filtering
   */
  async list(params: TaskQueryParams, userId?: string) {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      projectId,
      assigneeId,
      agentId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(projectId && { projectId }),
      ...(assigneeId && { assigneeId }),
      ...(agentId && { agentId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build orderBy
    const orderBy: any = {
      [sortBy]: sortOrder,
    };

    // Execute queries in parallel
    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.task.count({ where }),
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
  async update(id: string, input: UpdateTaskInput, userId?: string): Promise<TaskWithRelations | null> {
    // Verify task exists
    const existingTask = await this.getById(id, userId);
    if (!existingTask) {
      return null;
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.projectId !== undefined && { projectId: input.projectId }),
        ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
        ...(input.agentId !== undefined && { agentId: input.agentId }),
        ...(input.dueDate !== undefined && { 
          dueDate: input.dueDate ? new Date(input.dueDate) : null 
        }),
        ...(input.confidenceScore !== undefined && { confidenceScore: input.confidenceScore }),
        ...(input.reasoningLog !== undefined && { 
          reasoningLog: input.reasoningLog 
        }),
      },
      include: {
        agent: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return task;
  }

  /**
   * Delete a task
   */
  async delete(id: string, userId?: string): Promise<boolean> {
    // Verify task exists
    const task = await this.getById(id, userId);
    if (!task) {
      return false;
    }

    await db.task.delete({ where: { id } });
    return true;
  }

  /**
   * Transition task status (with validation)
   */
  async transitionStatus(id: string, newStatus: TaskStatus, userId?: string): Promise<TaskWithRelations | null> {
    const task = await this.getById(id, userId);
    if (!task) {
      return null;
    }

    // Validate status transition
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.CANCELLED],
      [TaskStatus.REVIEW]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.DONE]: [],
      [TaskStatus.CANCELLED]: [TaskStatus.TODO],
    };

    if (!validTransitions[task.status].includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${task.status} to ${newStatus}`
      );
    }

    return this.update(id, { status: newStatus }, userId);
  }

  /**
   * Get task statistics by status
   */
  async getStatsByStatus(projectId?: string) {
    const where: any = projectId ? { projectId } : {};

    const stats = await db.task.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return stats.reduce((acc: any, stat: any) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get tasks by status (for Kanban board)
   */
  async getByStatus(projectId?: string) {
    const where: any = projectId ? { projectId } : {};

    const tasks = await db.task.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Group tasks by status
    const grouped = {
      [TaskStatus.TODO]: tasks.filter((t: any) => t.status === TaskStatus.TODO),
      [TaskStatus.IN_PROGRESS]: tasks.filter((t: any) => t.status === TaskStatus.IN_PROGRESS),
      [TaskStatus.REVIEW]: tasks.filter((t: any) => t.status === TaskStatus.REVIEW),
      [TaskStatus.DONE]: tasks.filter((t: any) => t.status === TaskStatus.DONE),
      [TaskStatus.CANCELLED]: tasks.filter((t: any) => t.status === TaskStatus.CANCELLED),
    };

    return grouped;
  }
}

// Export singleton instance
export const taskService = new TaskService();
