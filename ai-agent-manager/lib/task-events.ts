/**
 * Task Event Emitter for Real-Time Updates
 * 
 * This module provides a simple pub/sub system for broadcasting task changes
 * to connected SSE clients. In production, this could be backed by Redis
 * for multi-instance deployments.
 */

export type TaskEventType = 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED'

export interface TaskEvent {
  type: TaskEventType
  taskId: string
  userId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
  timestamp: Date
}

type TaskEventCallback = (event: TaskEvent) => void

class TaskEventEmitter {
  private listeners: Map<string, Set<TaskEventCallback>> = new Map()

  /**
   * Subscribe to task events for a specific user
   */
  subscribe(userId: string, callback: TaskEventCallback): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set())
    }
    this.listeners.get(userId)!.add(callback)

    // Return unsubscribe function
    return () => {
      const userListeners = this.listeners.get(userId)
      if (userListeners) {
        userListeners.delete(callback)
        if (userListeners.size === 0) {
          this.listeners.delete(userId)
        }
      }
    }
  }

  /**
   * Emit a task event to all subscribers for a user
   */
  emit(event: TaskEvent): void {
    const userListeners = this.listeners.get(event.userId)
    if (userListeners) {
      userListeners.forEach((callback) => {
        try {
          callback(event)
        } catch (error) {
          console.error('Error in task event callback:', error)
        }
      })
    }
  }

  /**
   * Get the number of active listeners for a user
   */
  getListenerCount(userId: string): number {
    return this.listeners.get(userId)?.size || 0
  }

  /**
   * Get total number of active connections
   */
  getTotalListenerCount(): number {
    let total = 0
    this.listeners.forEach((set) => {
      total += set.size
    })
    return total
  }
}

// Singleton instance
export const taskEventEmitter = new TaskEventEmitter()

// Helper functions for emitting events
export function emitTaskCreated(userId: string, taskId: string, data?: unknown): void {
  taskEventEmitter.emit({
    type: 'TASK_CREATED',
    taskId,
    userId,
    data,
    timestamp: new Date(),
  })
}

export function emitTaskUpdated(userId: string, taskId: string, data?: unknown): void {
  taskEventEmitter.emit({
    type: 'TASK_UPDATED',
    taskId,
    userId,
    data,
    timestamp: new Date(),
  })
}

export function emitTaskDeleted(userId: string, taskId: string): void {
  taskEventEmitter.emit({
    type: 'TASK_DELETED',
    taskId,
    userId,
    timestamp: new Date(),
  })
}
