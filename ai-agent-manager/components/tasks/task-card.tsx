'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Bot, GripVertical, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Task, PRIORITY_COLORS, STATUS_COLORS } from '@/types/task'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  isDragging?: boolean
}

export function TaskCard({ task, onEdit, onDelete, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityColor = PRIORITY_COLORS[task.priority]
  const statusColor = STATUS_COLORS[task.status]
  const dragging = isDragging || isSortableDragging

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card p-3 shadow-sm transition-all',
        statusColor.border,
        dragging ? 'opacity-50 shadow-lg ring-2 ring-primary' : 'hover:shadow-md',
        'cursor-grab active:cursor-grabbing'
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="pl-4">
        {/* Header with title and menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-medium leading-tight line-clamp-2">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(task)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(task.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        {/* Priority badge */}
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="secondary"
            className={cn('text-xs', priorityColor.bg, priorityColor.text)}
          >
            {task.priority.toLowerCase()}
          </Badge>
          {task.project && (
            <Badge variant="outline" className="text-xs">
              {task.project.name}
            </Badge>
          )}
        </div>

        {/* Footer with assignee and due date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={task.assignee.image || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {task.assignee.name?.[0] || task.assignee.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[80px]">
                  {task.assignee.name || task.assignee.email.split('@')[0]}
                </span>
              </div>
            )}
            {task.agent && (
              <div className="flex items-center gap-1">
                <Bot className="h-4 w-4" />
                <span className="truncate max-w-[80px]">{task.agent.name}</span>
              </div>
            )}
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
