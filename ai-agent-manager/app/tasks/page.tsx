'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KanbanBoard, TaskModal } from '@/components/tasks'
import { Button } from '@/components/ui/button'
import { Task, TaskStatus, CreateTaskInput } from '@/types/task'
import { toast } from 'sonner'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('TODO')

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tasks')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Handle task status change (drag and drop)
  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    )

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      toast.success('Task updated')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
      // Revert on error
      fetchTasks()
    }
  }

  // Handle add task button click
  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setDefaultStatus(task.status)
    setModalOpen(true)
  }

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    // Optimistic update
    setTasks((prev) => prev.filter((task) => task.id !== taskId))

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      toast.success('Task deleted')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
      // Revert on error
      fetchTasks()
    }
  }

  // Handle modal submit (create or update)
  const handleModalSubmit = async (data: CreateTaskInput) => {
    setIsSaving(true)

    try {
      if (editingTask) {
        // Update existing task
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error('Failed to update task')
        }

        const updatedTask = await response.json()
        setTasks((prev) =>
          prev.map((task) => (task.id === editingTask.id ? updatedTask : task))
        )
        toast.success('Task updated')
      } else {
        // Create new task
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error('Failed to create task')
        }

        const newTask = await response.json()
        setTasks((prev) => [newTask, ...prev])
        toast.success('Task created')
      }

      setModalOpen(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(editingTask ? 'Failed to update task' : 'Failed to create task')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track your tasks with the Kanban board
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTasks}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => handleAddTask('TODO')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <KanbanBoard
          tasks={tasks}
          onTaskMove={handleTaskMove}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          isLoading={isLoading}
        />

        {/* Task Modal */}
        <TaskModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open)
            if (!open) {
              setEditingTask(null)
            }
          }}
          task={editingTask}
          defaultStatus={defaultStatus}
          onSubmit={handleModalSubmit}
          isLoading={isSaving}
        />
      </div>
    </DashboardLayout>
  )
}
