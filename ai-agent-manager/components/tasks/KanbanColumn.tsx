'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Task, TaskStatus, KANBAN_COLUMNS } from '@/types/task'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TaskCard } from './TaskCard'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onAddTask: (status: TaskStatus) => void
  onTaskClick: (task: Task) => void
}

export function KanbanColumn({ status, tasks, onAddTask, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const column = KANBAN_COLUMNS.find((c) => c.id === status)
  const taskIds = tasks.map((t) => t.id)

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border min-h-[500px] w-72 shrink-0',
        column?.color,
        isOver && 'ring-2 ring-primary ring-offset-2',
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{column?.label}</h3>
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onAddTask(status)}
          className="opacity-0 group-hover:opacity-100 hover:opacity-100"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Task list */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">No tasks</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddTask(status)}
              className="mt-2"
            >
              <Plus className="size-4 mr-1" />
              Add task
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
