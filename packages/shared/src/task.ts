export interface Task {
  id: string;
  agentId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Trust & Transparency fields
  confidenceScore?: number;  // 0.0 - 1.0
  reasoningLog?: any;  // Structured reasoning from agent
  executionSteps?: any;  // Step-by-step execution details
  requiresReview?: boolean;  // Flagged for human review
  reviewedAt?: Date;
  reviewedById?: string;
  reviewNotes?: string;  // Human reviewer feedback
  wasOverridden?: boolean;  // Human overrode agent decision
  calibrationFeedback?: any;  // Structured feedback for improving confidence
  firstAttemptAt?: Date;  // Track retry velocity
  retryCount?: number;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface CreateTaskInput {
  agentId: string;
  title: string;
  description: string;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  result?: any;
  error?: string;
  
  // Trust & review fields
  confidenceScore?: number;
  reasoningLog?: any;
  executionSteps?: any;
  requiresReview?: boolean;
  reviewNotes?: string;
  wasOverridden?: boolean;
  calibrationFeedback?: any;
}
