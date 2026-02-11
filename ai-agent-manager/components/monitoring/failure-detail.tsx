'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { FailedTask, TaskPriority } from '@/types/monitoring'
import {
  AlertCircle,
  Bot,
  Calendar,
  Clock,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react'

interface FailureDetailProps {
  task: FailedTask | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRetry?: (taskId: string) => void
  onDelete?: (taskId: string) => void
}

interface FailedTaskListProps {
  tasks: FailedTask[]
  isLoading?: boolean
  onSelectTask?: (task: FailedTask) => void
  onRetry?: (taskId: string) => void
}

const priorityConfig: Record<
  TaskPriority,
  { color: string; bgColor: string; label: string }
> = {
  LOW: {
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    label: 'Low',
  },
  MEDIUM: {
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Medium',
  },
  HIGH: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'High',
  },
  CRITICAL: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Critical',
  },
}

function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString()
}

export function FailureDetail({
  task,
  open,
  onOpenChange,
  onRetry,
  onDelete,
}: FailureDetailProps) {
  if (!task) return null

  const priorityStyle = priorityConfig[task.priority]
  const canRetry = task.retryCount < task.maxRetries

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Failed Task Details
          </DialogTitle>
          <DialogDescription>
            Review the error details and decide how to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Info */}
          <div>
            <h4 className="text-sm font-medium mb-2">{task.title}</h4>
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn('text-xs', priorityStyle.color)}
              >
                {priorityStyle.label} Priority
              </Badge>
            </div>
            {task.agentName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bot className="h-4 w-4" />
                <span>{task.agentName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(task.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4" />
              <span>
                {task.retryCount} / {task.maxRetries} retries
              </span>
            </div>
          </div>

          {/* Error Message */}
          {task.errorMessage && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Error Message</span>
              </div>
              <pre className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-auto max-h-40 font-mono">
                {task.errorMessage}
              </pre>
            </div>
          )}

          {/* Retry Info */}
          {!canRetry && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Maximum retry attempts reached. Consider creating a new task.
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => {
              onDelete?.(task.id)
              onOpenChange(false)
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Task
          </Button>
          <Button
            disabled={!canRetry}
            onClick={() => {
              onRetry?.(task.id)
              onOpenChange(false)
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {canRetry ? 'Retry Task' : 'No Retries Left'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FailedTaskCard({
  task,
  onSelect,
  onRetry,
}: {
  task: FailedTask
  onSelect?: (task: FailedTask) => void
  onRetry?: (taskId: string) => void
}) {
  const priorityStyle = priorityConfig[task.priority]
  const canRetry = task.retryCount < task.maxRetries

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onSelect?.(task)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <h4 className="text-sm font-medium truncate">{task.title}</h4>
            </div>
            {task.errorMessage && (
              <p className="text-xs text-muted-foreground truncate">
                {task.errorMessage}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn('text-xs', priorityStyle.color)}
              >
                {priorityStyle.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {task.retryCount}/{task.maxRetries} retries
              </span>
              {task.agentName && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  {task.agentName}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!canRetry}
            onClick={(e) => {
              e.stopPropagation()
              onRetry?.(task.id)
            }}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function FailedTaskList({
  tasks,
  isLoading = false,
  onSelectTask,
  onRetry,
}: FailedTaskListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            Failed Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600" />
          Failed Tasks
          {tasks.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {tasks.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <XCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No failed tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <FailedTaskCard
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onRetry={onRetry}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
