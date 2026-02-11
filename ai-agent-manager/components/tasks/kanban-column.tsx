'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TaskCard } from './task-card'
import { Task, TaskStatus, STATUS_COLORS } from '@/types/task'

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  onAddTask?: (status: TaskStatus) => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
}

export function KanbanColumn({
  id,
  title,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const statusColor = STATUS_COLORS[id]

  return (
    <div
      className={cn(
        'flex flex-col w-72 min-w-[288px] h-full rounded-lg border bg-muted/30',
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Column header */}
      <div
        className={cn(
          'flex items-center justify-between px-3 py-2 border-b rounded-t-lg',
          statusColor.bg
        )}
      >
        <div className="flex items-center gap-2">
          <h3 className={cn('font-semibold text-sm', statusColor.text)}>
            {title}
          </h3>
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              statusColor.bg,
              statusColor.text,
              'border',
              statusColor.border
            )}
          >
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onAddTask?.(id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable task list */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <p>No tasks</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => onAddTask?.(id)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add task
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
