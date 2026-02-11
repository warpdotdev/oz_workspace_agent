'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/types/task'

export function useTasks(pollInterval = 5000) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const data = await response.json()
      setTasks(data.tasks || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new task
  const createTask = useCallback(async (input: CreateTaskInput) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create task')
      }
      
      const data = await response.json()
      setTasks((prev) => [...prev, data.task])
      return data.task
    } catch (err) {
      throw err
    }
  }, [])

  // Update existing task
  const updateTask = useCallback(
    async (taskId: string, input: UpdateTaskInput) => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        })
        
        if (!response.ok) {
          throw new Error('Failed to update task')
        }
        
        const data = await response.json()
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? data.task : task))
        )
        return data.task
      } catch (err) {
        throw err
      }
    },
    []
  )

  // Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
      
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    } catch (err) {
      throw err
    }
  }, [])

  // Move task to different status
  const moveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      // Optimistic update
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      )

      try {
        await updateTask(taskId, { status: newStatus })
      } catch (err) {
        // Revert on error
        await fetchTasks()
        throw err
      }
    },
    [updateTask, fetchTasks]
  )

  // Initial fetch
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Polling for real-time updates
  useEffect(() => {
    if (pollInterval <= 0) return

    const interval = setInterval(() => {
      fetchTasks()
    }, pollInterval)

    return () => clearInterval(interval)
  }, [pollInterval, fetchTasks])

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    refetch: fetchTasks,
  }
}
