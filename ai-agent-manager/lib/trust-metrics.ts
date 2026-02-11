import { db } from '@/lib/db'

/**
 * Trust Metrics Tracking
 * 
 * Per @product-lead guidance, these metrics are critical for trust calibration:
 * 1. False confidence rate: Tasks marked high confidence but requiring human correction
 * 2. Task retry velocity: Time from failure to retry completion
 * 
 * These are first-class features, not edge cases.
 */

export interface TrustMetrics {
  // False confidence rate metrics
  totalHighConfidenceTasks: number
  overriddenHighConfidenceTasks: number
  falseConfidenceRate: number
  
  // Retry velocity metrics
  totalRetries: number
  averageRetryVelocityMs: number | null
  
  // Review metrics
  tasksRequiringReview: number
  tasksReviewed: number
  reviewRate: number
  
  // Agent-level confidence
  averageAgentConfidence: number | null
}

export interface AgentTrustMetrics {
  agentId: string
  agentName: string
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageConfidence: number | null
  falseConfidenceRate: number
  requiresReviewCount: number
}

/**
 * Calculate trust metrics for a user's tasks
 * High confidence threshold is 0.7 (70%)
 */
export async function calculateTrustMetrics(userId: string): Promise<TrustMetrics> {
  const HIGH_CONFIDENCE_THRESHOLD = 0.7

  // Get all tasks created by user
  const tasks = await db.task.findMany({
    where: { createdById: userId },
    select: {
      id: true,
      confidenceScore: true,
      requiresReview: true,
      reviewedAt: true,
      wasOverridden: true,
      retryCount: true,
      firstAttemptAt: true,
      updatedAt: true,
      status: true,
    },
  })

  // Calculate false confidence rate
  const highConfidenceTasks = tasks.filter(
    (t) => t.confidenceScore !== null && t.confidenceScore >= HIGH_CONFIDENCE_THRESHOLD
  )
  const overriddenHighConfidence = highConfidenceTasks.filter((t) => t.wasOverridden)
  
  const falseConfidenceRate = highConfidenceTasks.length > 0
    ? overriddenHighConfidence.length / highConfidenceTasks.length
    : 0

  // Calculate retry velocity
  const retriedTasks = tasks.filter((t) => t.retryCount > 0 && t.firstAttemptAt)
  let totalRetryTimeMs = 0
  let validRetryCount = 0

  for (const task of retriedTasks) {
    if (task.firstAttemptAt && task.status === 'DONE') {
      const retryTime = task.updatedAt.getTime() - task.firstAttemptAt.getTime()
      totalRetryTimeMs += retryTime
      validRetryCount++
    }
  }

  const averageRetryVelocityMs = validRetryCount > 0 
    ? totalRetryTimeMs / validRetryCount 
    : null

  // Review metrics
  const tasksRequiringReview = tasks.filter((t) => t.requiresReview).length
  const tasksReviewed = tasks.filter((t) => t.reviewedAt !== null).length
  const reviewRate = tasksRequiringReview > 0 
    ? tasksReviewed / tasksRequiringReview 
    : 0

  // Average confidence
  const tasksWithConfidence = tasks.filter((t) => t.confidenceScore !== null)
  const averageAgentConfidence = tasksWithConfidence.length > 0
    ? tasksWithConfidence.reduce((sum, t) => sum + (t.confidenceScore ?? 0), 0) / tasksWithConfidence.length
    : null

  return {
    totalHighConfidenceTasks: highConfidenceTasks.length,
    overriddenHighConfidenceTasks: overriddenHighConfidence.length,
    falseConfidenceRate,
    totalRetries: retriedTasks.reduce((sum, t) => sum + t.retryCount, 0),
    averageRetryVelocityMs,
    tasksRequiringReview,
    tasksReviewed,
    reviewRate,
    averageAgentConfidence,
  }
}

/**
 * Calculate trust metrics per agent
 */
export async function calculateAgentTrustMetrics(
  userId: string
): Promise<AgentTrustMetrics[]> {
  const HIGH_CONFIDENCE_THRESHOLD = 0.7

  const agents = await db.agent.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      tasks: {
        select: {
          id: true,
          status: true,
          confidenceScore: true,
          wasOverridden: true,
          requiresReview: true,
        },
      },
    },
  })

  return agents.map((agent) => {
    const tasks = agent.tasks
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length
    const failedTasks = tasks.filter((t) => t.status === 'CANCELLED').length

    const tasksWithConfidence = tasks.filter((t) => t.confidenceScore !== null)
    const averageConfidence = tasksWithConfidence.length > 0
      ? tasksWithConfidence.reduce((sum, t) => sum + (t.confidenceScore ?? 0), 0) / tasksWithConfidence.length
      : null

    const highConfidenceTasks = tasks.filter(
      (t) => t.confidenceScore !== null && t.confidenceScore >= HIGH_CONFIDENCE_THRESHOLD
    )
    const overriddenHighConfidence = highConfidenceTasks.filter((t) => t.wasOverridden)
    const falseConfidenceRate = highConfidenceTasks.length > 0
      ? overriddenHighConfidence.length / highConfidenceTasks.length
      : 0

    return {
      agentId: agent.id,
      agentName: agent.name,
      totalTasks: tasks.length,
      completedTasks,
      failedTasks,
      averageConfidence,
      falseConfidenceRate,
      requiresReviewCount: tasks.filter((t) => t.requiresReview).length,
    }
  })
}

/**
 * Auto-flag task for review based on confidence
 * Per product-lead: Manual assignment first, automated review flagging
 */
export function shouldRequireReview(confidenceScore: number | null): boolean {
  const LOW_CONFIDENCE_THRESHOLD = 0.5
  return confidenceScore !== null && confidenceScore < LOW_CONFIDENCE_THRESHOLD
}

/**
 * Record an override event for trust tracking
 */
export async function recordOverride(
  taskId: string,
  reviewerId: string,
  reviewNotes?: string
): Promise<void> {
  await db.task.update({
    where: { id: taskId },
    data: {
      wasOverridden: true,
      reviewedAt: new Date(),
      reviewedById: reviewerId,
      reviewNotes: reviewNotes ?? null,
    },
  })
}

/**
 * Record a retry attempt for velocity tracking
 */
export async function recordRetry(taskId: string): Promise<void> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { firstAttemptAt: true, retryCount: true },
  })

  await db.task.update({
    where: { id: taskId },
    data: {
      retryCount: (task?.retryCount ?? 0) + 1,
      firstAttemptAt: task?.firstAttemptAt ?? new Date(),
      status: 'TODO', // Reset to TODO for retry
    },
  })
}
