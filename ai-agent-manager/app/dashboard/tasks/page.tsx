'use client'

import { useState } from 'react'
import { Plus, RefreshCw, AlertCircle } from 'lucide-react'
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '@/types/task'
import { useTasks } from '@/hooks/useTasks'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { TaskDialog } from '@/components/tasks/TaskDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function TasksPage() {
  const { tasks, isLoading, error, createTask, updateTask, deleteTask, moveTask, refetch } = useTasks()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('TODO')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddTask = (status: TaskStatus) => {
    setSelectedTask(null)
    setDefaultStatus(status)
    setIsDialogOpen(true)
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDefaultStatus(task.status)
    setIsDialogOpen(true)
  }

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    await moveTask(taskId, newStatus)
  }

  const handleSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    setIsSubmitting(true)
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, data as UpdateTaskInput)
      } else {
        await createTask(data as CreateTaskInput)
      }
      setIsDialogOpen(false)
      setSelectedTask(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (taskId: string) => {
    setIsSubmitting(true)
    try {
      await deleteTask(taskId)
      setIsDialogOpen(false)
      setSelectedTask(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 shrink-0">
              <Skeleton className="h-12 mb-2" />
              <div className="space-y-2">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Task Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Drag and drop tasks to change their status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => handleAddTask('TODO')}>
            <Plus className="size-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="size-5 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      <KanbanBoard
        tasks={tasks}
        onTaskMove={handleTaskMove}
        onAddTask={handleAddTask}
        onTaskClick={handleTaskClick}
      />

      {/* Task Dialog */}
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        task={selectedTask}
        defaultStatus={defaultStatus}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
