'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Calendar, User, Bot } from 'lucide-react'
import { Task, PRIORITY_CONFIG } from '@/types/task'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityConfig = PRIORITY_CONFIG[task.priority]

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-pointer p-3 transition-all hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg rotate-2',
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          className="mt-0.5 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          {/* Title */}
          <p className="font-medium text-sm leading-tight truncate">{task.title}</p>

          {/* Description preview */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Footer with metadata */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Priority badge */}
              <Badge
                variant="secondary"
                className={cn('text-[10px] px-1.5 py-0', priorityConfig.className)}
              >
                {priorityConfig.label}
              </Badge>

              {/* Due date */}
              {task.dueDate && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="size-3" />
                  {formatDate(task.dueDate)}
                </span>
              )}
            </div>

            {/* Assignee / Agent */}
            <div className="flex items-center gap-1">
              {task.agent && (
                <div className="flex items-center gap-1" title={`Agent: ${task.agent.name}`}>
                  <Bot className="size-3 text-blue-500" />
                </div>
              )}
              {task.assignee && (
                <Avatar className="size-5">
                  <AvatarImage src={task.assignee.image || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {getInitials(task.assignee.name, task.assignee.email)}
                  </AvatarFallback>
                </Avatar>
              )}
              {!task.assignee && !task.agent && (
                <div className="size-5 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <User className="size-3 text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
