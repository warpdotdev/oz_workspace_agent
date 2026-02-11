'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ActivityEvent, EventLevel, EventType } from '@/types/monitoring'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bot,
  CheckCircle,
  Info,
  Play,
  RefreshCw,
  Settings,
  Square,
  XCircle,
} from 'lucide-react'

interface ActivityFeedProps {
  events: ActivityEvent[]
  isLoading?: boolean
  maxHeight?: string
}

const levelColors: Record<EventLevel, string> = {
  DEBUG: 'text-muted-foreground bg-muted',
  INFO: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30',
  WARNING: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30',
  ERROR: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
  CRITICAL: 'text-red-900 bg-red-200 dark:text-red-200 dark:bg-red-900/50',
}

const eventIcons: Record<EventType, React.ElementType> = {
  AGENT_STARTED: Play,
  AGENT_STOPPED: Square,
  AGENT_ERROR: AlertCircle,
  AGENT_CONFIG_UPDATED: Settings,
  TASK_CREATED: Activity,
  TASK_STARTED: Play,
  TASK_COMPLETED: CheckCircle,
  TASK_FAILED: XCircle,
  TASK_CANCELLED: XCircle,
  TASK_RETRYING: RefreshCw,
  SYSTEM_INFO: Info,
  SYSTEM_WARNING: AlertTriangle,
  SYSTEM_ERROR: AlertCircle,
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function EventItem({ event }: { event: ActivityEvent }) {
  const Icon = eventIcons[event.type] || Activity
  const levelClass = levelColors[event.level]

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div
        className={cn(
          'flex-shrink-0 p-1.5 rounded-full',
          levelClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{event.message}</p>
          <Badge variant="outline" className="text-xs">
            {event.level}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{formatTimestamp(event.timestamp)}</span>
          {event.agentName && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {event.agentName}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ActivityFeed({
  events,
  isLoading = false,
  maxHeight = '400px',
}: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Recent Activity
          {!isLoading && events.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {events.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="overflow-y-auto pr-2"
          style={{ maxHeight }}
        >
          {isLoading ? (
            <LoadingSkeleton />
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            events.map((event) => <EventItem key={event.id} event={event} />)
          )}
        </div>
      </CardContent>
    </Card>
  )
}
