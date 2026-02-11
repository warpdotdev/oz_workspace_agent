import { Card } from '@/components/ui/card'
import { PriorityBadge } from './priority-badge'
import { Task } from '@/types/task'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Clock, User } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-zinc-900"
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm line-clamp-2 flex-1">
            {task.title}
          </h3>
          <PriorityBadge priority={task.priority} />
        </div>

        {task.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
          <div className="flex items-center gap-2">
            {task.agent ? (
              <Badge variant="secondary" className="text-xs">
                <User className="w-3 h-3 mr-1" />
                {task.agent.name}
              </Badge>
            ) : task.assignee ? (
              <div className="flex items-center gap-1">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={task.assignee.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{task.assignee.name || task.assignee.email}</span>
              </div>
            ) : (
              <span className="text-zinc-400">Unassigned</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(task.createdAt)}</span>
          </div>
        </div>

        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            <span>Due {formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
