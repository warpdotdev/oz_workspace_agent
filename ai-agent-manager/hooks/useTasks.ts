'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '@/types/task'

interface UseTasksOptions {
  pollingInterval?: number // in milliseconds, 0 to disable
}

interface UseTasksReturn {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  createTask: (data: CreateTaskInput) => Promise<Task | null>
  updateTask: (taskId: string, data: UpdateTaskInput) => Promise<Task | null>
  deleteTask: (taskId: string) => Promise<boolean>
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<Task | null>
  refetch: () => Promise<void>
}

export function useTasks(options: UseTasksOptions = {}): UseTasksReturn {
  const { pollingInterval = 5000 } = options
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const data = await res.json()
      setTasks(data.tasks || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Polling
  useEffect(() => {
    if (pollingInterval > 0) {
      pollingRef.current = setInterval(fetchTasks, pollingInterval)
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
        }
      }
    }
  }, [fetchTasks, pollingInterval])

  const createTask = useCallback(async (data: CreateTaskInput): Promise<Task | null> => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create task')
      }

      const newTask = await res.json()
      // Optimistic update
      setTasks((prev) => [...prev, newTask])
      return newTask
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
      return null
    }
  }, [])

  const updateTask = useCallback(async (taskId: string, data: UpdateTaskInput): Promise<Task | null> => {
    // Store previous state for rollback
    const previousTasks = tasks

    // Optimistic update
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...data } : task
      )
    )

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        throw new Error('Failed to update task')
      }

      const updatedTask = await res.json()
      // Sync with server response
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? updatedTask : task
        )
      )
      return updatedTask
    } catch (err) {
      // Rollback on error
      setTasks(previousTasks)
      setError(err instanceof Error ? err.message : 'Failed to update task')
      return null
    }
  }, [tasks])

  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    // Store previous state for rollback
    const previousTasks = tasks

    // Optimistic update
    setTasks((prev) => prev.filter((task) => task.id !== taskId))

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete task')
      }

      return true
    } catch (err) {
      // Rollback on error
      setTasks(previousTasks)
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      return false
    }
  }, [tasks])

  const moveTask = useCallback(async (taskId: string, newStatus: TaskStatus): Promise<Task | null> => {
    return updateTask(taskId, { status: newStatus })
  }, [updateTask])

  const refetch = useCallback(async () => {
    setIsLoading(true)
    await fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    refetch,
  }
}
