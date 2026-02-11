'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TaskCard } from './task-card'
import { Task, TaskStatus } from '@/types/task'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  status: TaskStatus
  title: string
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onAddTask?: () => void
}

const statusColors: Record<TaskStatus, string> = {
  TODO: 'border-gray-300 dark:border-gray-700',
  IN_PROGRESS: 'border-blue-400 dark:border-blue-600',
  REVIEW: 'border-orange-400 dark:border-orange-600',
  DONE: 'border-green-400 dark:border-green-600',
  CANCELLED: 'border-red-400 dark:border-red-600',
}

const statusBadgeColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  REVIEW: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  DONE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export function KanbanColumn({
  status,
  title,
  tasks,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const taskIds = tasks.map((task) => task.id)

  return (
    <div className="flex-shrink-0 w-80">
      <Card
        className={cn(
          'h-full flex flex-col border-t-4',
          statusColors[status],
          isOver && 'ring-2 ring-primary'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium',
                  statusBadgeColors[status]
                )}
              >
                {tasks.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onAddTask}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div ref={setNodeRef} className="min-h-[100px]">
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick?.(task)}
                />
              ))}
            </SortableContext>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
