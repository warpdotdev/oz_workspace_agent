import { Task } from '@prisma/client'

// WebSocket event types
export enum TaskEventType {
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  TASK_STATUS_CHANGED = 'task:status_changed',
}

// WebSocket event payload
export interface TaskEvent {
  type: TaskEventType
  task?: Task
  taskId?: string
  userId: string
  timestamp: string
}

// WebSocket broadcaster singleton
class TaskEventBroadcaster {
  private static instance: TaskEventBroadcaster
  private clients: Set<any> = new Set()

  private constructor() {}

  static getInstance(): TaskEventBroadcaster {
    if (!TaskEventBroadcaster.instance) {
      TaskEventBroadcaster.instance = new TaskEventBroadcaster()
    }
    return TaskEventBroadcaster.instance
  }

  addClient(client: any) {
    this.clients.add(client)
  }

  removeClient(client: any) {
    this.clients.delete(client)
  }

  broadcast(event: TaskEvent) {
    const message = JSON.stringify(event)
    this.clients.forEach((client) => {
      try {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          client.send(message)
        }
      } catch (error) {
        console.error('Error broadcasting to client:', error)
        this.clients.delete(client)
      }
    })
  }

  broadcastTaskCreated(task: Task, userId: string) {
    this.broadcast({
      type: TaskEventType.TASK_CREATED,
      task,
      userId,
      timestamp: new Date().toISOString(),
    })
  }

  broadcastTaskUpdated(task: Task, userId: string) {
    this.broadcast({
      type: TaskEventType.TASK_UPDATED,
      task,
      userId,
      timestamp: new Date().toISOString(),
    })
  }

  broadcastTaskDeleted(taskId: string, userId: string) {
    this.broadcast({
      type: TaskEventType.TASK_DELETED,
      taskId,
      userId,
      timestamp: new Date().toISOString(),
    })
  }

  broadcastTaskStatusChanged(task: Task, userId: string) {
    this.broadcast({
      type: TaskEventType.TASK_STATUS_CHANGED,
      task,
      userId,
      timestamp: new Date().toISOString(),
    })
  }
}

export const taskEventBroadcaster = TaskEventBroadcaster.getInstance()
