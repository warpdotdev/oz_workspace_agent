import { Card } from '@/components/ui/card'
import { PriorityBadge } from './priority-badge'
import { ConfidenceBadge, ReviewRequiredBadge } from './confidence-badge'
import { Task } from '@/types/task'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CardDensity } from './task-filters'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  density?: CardDensity
}

export function TaskCard({ task, onClick, density = 'comfortable' }: TaskCardProps) {
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

  const isCompact = density === 'compact'
  const isSpaciouos = density === 'spacious'

  // Show review required badge if confidence is below 70%
  const showReviewRequired = task.requiresReview || 
    (task.confidenceScore !== null && task.confidenceScore !== undefined && task.confidenceScore < 70)

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-zinc-900',
        isCompact ? 'p-2' : isSpaciouos ? 'p-5' : 'p-4'
      )}
      onClick={onClick}
    >
      <div className={cn(isCompact ? 'space-y-1' : isSpaciouos ? 'space-y-4' : 'space-y-3')}>
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn(
            'font-medium flex-1',
            isCompact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'
          )}>
            {task.title}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <PriorityBadge priority={task.priority} />
          </div>
        </div>

        {/* Show review required badge */}
        {showReviewRequired && (
          <ReviewRequiredBadge />
        )}

        {/* Confidence score */}
        {task.confidenceScore !== null && task.confidenceScore !== undefined && (
          <ConfidenceBadge confidence={task.confidenceScore} showBar={!isCompact} />
        )}

        {!isCompact && task.description && (
          <p className={cn(
            'text-zinc-600 dark:text-zinc-400',
            isSpaciouos ? 'text-sm line-clamp-3' : 'text-sm line-clamp-2'
          )}>
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
          <div className="flex items-center gap-2">
            {task.agent ? (
              <Badge variant="secondary" className="text-xs">
                <User className="w-3 h-3 mr-1" />
                {isCompact ? task.agent.name.slice(0, 8) : task.agent.name}
              </Badge>
            ) : task.assignee ? (
              <div className="flex items-center gap-1">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={task.assignee.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.name?.charAt(0) || task.assignee.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {!isCompact && (
                  <span className="text-xs">{task.assignee.name || task.assignee.email}</span>
                )}
              </div>
            ) : (
              <span className="text-zinc-400">{isCompact ? '—' : 'Unassigned'}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(task.createdAt)}</span>
          </div>
        </div>

        {!isCompact && task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            <span>Due {formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>
    </Card>
  )
}
