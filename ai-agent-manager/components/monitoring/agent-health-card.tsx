'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AgentHealth, AgentStatus } from '@/types/monitoring'
import {
  Bot,
  Activity,
  AlertCircle,
  Clock,
  Play,
  Pause,
  Square,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AgentHealthCardProps {
  agent: AgentHealth
  onStart?: (id: string) => void
  onPause?: (id: string) => void
  onStop?: (id: string) => void
  onViewDetails?: (id: string) => void
}

interface AgentHealthListProps {
  agents: AgentHealth[]
  isLoading?: boolean
  onStart?: (id: string) => void
  onPause?: (id: string) => void
  onStop?: (id: string) => void
  onViewDetails?: (id: string) => void
}

const statusConfig: Record<
  AgentStatus,
  { color: string; bgColor: string; icon: React.ElementType; label: string }
> = {
  RUNNING: {
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: Play,
    label: 'Running',
  },
  IDLE: {
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: Clock,
    label: 'Idle',
  },
  PAUSED: {
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: Pause,
    label: 'Paused',
  },
  ERROR: {
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertCircle,
    label: 'Error',
  },
  TERMINATED: {
    color: 'text-gray-500 dark:text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    icon: Square,
    label: 'Terminated',
  },
}

function formatUptime(createdAt: string, lastActiveAt: string | null): string {
  const start = new Date(createdAt)
  const end = lastActiveAt ? new Date(lastActiveAt) : new Date()
  const diffMs = end.getTime() - start.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
  if (diffHours > 0) return `${diffHours}h`
  return 'Just started'
}

export function AgentHealthCard({
  agent,
  onStart,
  onPause,
  onStop,
  onViewDetails,
}: AgentHealthCardProps) {
  const config = statusConfig[agent.status]
  const StatusIcon = config.icon

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-2 rounded-lg',
                config.bgColor
              )}
            >
              <Bot className={cn('h-4 w-4', config.color)} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
              <Badge
                variant="outline"
                className={cn('mt-1 text-xs', config.color)}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {agent.status !== 'RUNNING' && agent.status !== 'TERMINATED' && (
                <DropdownMenuItem onClick={() => onStart?.(agent.id)}>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </DropdownMenuItem>
              )}
              {agent.status === 'RUNNING' && (
                <DropdownMenuItem onClick={() => onPause?.(agent.id)}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </DropdownMenuItem>
              )}
              {(agent.status === 'RUNNING' || agent.status === 'PAUSED') && (
                <DropdownMenuItem onClick={() => onStop?.(agent.id)}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onViewDetails?.(agent.id)}>
                <Activity className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold">{agent.totalRuns}</p>
            <p className="text-xs text-muted-foreground">Tasks</p>
          </div>
          <div>
            <p className="text-lg font-semibold">
              {agent.successRate !== null ? `${Math.round(agent.successRate)}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Success</p>
          </div>
          <div>
            <p
              className={cn(
                'text-lg font-semibold',
                agent.errorCount > 0 && 'text-red-600 dark:text-red-400'
              )}
            >
              {agent.errorCount}
            </p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Uptime: {formatUptime(agent.createdAt, agent.lastActiveAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="text-center space-y-1">
                  <Skeleton className="h-6 w-8 mx-auto" />
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AgentHealthList({
  agents,
  isLoading = false,
  onStart,
  onPause,
  onStop,
  onViewDetails,
}: AgentHealthListProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Bot className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No agents configured</p>
          <Button variant="outline" size="sm" className="mt-4">
            Create Agent
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <AgentHealthCard
          key={agent.id}
          agent={agent}
          onStart={onStart}
          onPause={onPause}
          onStop={onStop}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  )
}
