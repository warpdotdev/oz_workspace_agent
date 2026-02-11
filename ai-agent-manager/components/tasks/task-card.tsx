'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Clock, User, Bot } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Task, TaskPriority } from '@/types/task'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'mb-3 transition-opacity',
        isDragging && 'opacity-50'
      )}
    >
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium leading-tight flex-1">
              {task.title}
            </CardTitle>
            <button
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('text-xs', priorityColors[task.priority])}>
              {task.priority}
            </Badge>
            
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task.assignee && (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-muted-foreground" />
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.name?.[0]?.toUpperCase() || 
                     task.assignee.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {task.assignee.name || task.assignee.email}
                </span>
              </div>
            )}
            
            {task.agent && (
              <div className="flex items-center gap-1.5">
                <Bot className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {task.agent.name}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
