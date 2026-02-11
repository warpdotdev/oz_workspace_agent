'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Task, TaskStatus } from '@/types/task'
import { TaskCard } from './task-card'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface KanbanColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  onAddTask?: (status: TaskStatus) => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  onTaskClick?: (task: Task) => void
}

const columnColors: Record<TaskStatus, string> = {
  TODO: 'border-t-gray-400',
  IN_PROGRESS: 'border-t-blue-500',
  REVIEW: 'border-t-purple-500',
  DONE: 'border-t-green-500',
  CANCELLED: 'border-t-red-500',
}

export function KanbanColumn({
  id,
  title,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      status: id,
    },
  })

  const taskIds = tasks.map((task) => task.id)

  return (
    <div
      className={cn(
        'flex h-full min-h-[500px] w-80 shrink-0 flex-col rounded-lg border border-t-4 bg-muted/30',
        columnColors[id],
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onAddTask(id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tasks container */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {tasks.length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
                <p className="text-sm text-muted-foreground">No tasks</p>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onClick={onTaskClick}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
