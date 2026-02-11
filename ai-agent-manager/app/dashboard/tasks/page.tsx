'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { TaskDialog } from '@/components/tasks/task-dialog'
import { Button } from '@/components/ui/button'
import { useTasks } from '@/lib/hooks/use-tasks'
import { Task, TaskStatus } from '@/types/task'
import { toast } from 'sonner'

export default function TasksPage() {
  const { tasks, loading, error, createTask, updateTask, moveTask } = useTasks(5000)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>()
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('TODO')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddTask = (status?: TaskStatus) => {
    setSelectedTask(undefined)
    setDefaultStatus(status || 'TODO')
    setIsDialogOpen(true)
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsDialogOpen(true)
  }

  const handleDialogSubmit = async (values: any) => {
    setIsSubmitting(true)
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, values)
        toast.success('Task updated successfully')
      } else {
        await createTask(values)
        toast.success('Task created successfully')
      }
      setIsDialogOpen(false)
    } catch (err) {
      toast.error(
        selectedTask ? 'Failed to update task' : 'Failed to create task'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await moveTask(taskId, newStatus)
      toast.success('Task moved successfully')
    } catch (err) {
      toast.error('Failed to move task')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-destructive">Error: {error}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
            <p className="text-muted-foreground">
              Manage and track tasks across your projects
            </p>
          </div>
          <Button onClick={() => handleAddTask()}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        <KanbanBoard
          tasks={tasks}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
        />

        <TaskDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          task={selectedTask}
          defaultStatus={defaultStatus}
          onSubmit={handleDialogSubmit}
          isLoading={isSubmitting}
        />
      </div>
    </DashboardLayout>
  )
}
