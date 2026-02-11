'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AgentStatus } from '@/lib/validations/agent'

interface AgentStatusBadgeProps {
  status: AgentStatus
  className?: string
}

const statusConfig: Record<
  AgentStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  IDLE: {
    label: 'Idle',
    variant: 'secondary',
  },
  RUNNING: {
    label: 'Running',
    variant: 'default',
  },
  PAUSED: {
    label: 'Paused',
    variant: 'outline',
  },
  ERROR: {
    label: 'Error',
    variant: 'destructive',
  },
  TERMINATED: {
    label: 'Terminated',
    variant: 'secondary',
  },
}

export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(
        status === 'RUNNING' && 'bg-green-600 hover:bg-green-700',
        status === 'PAUSED' && 'bg-amber-100 text-amber-800 border-amber-200',
        status === 'IDLE' && 'bg-gray-100 text-gray-600 border-gray-200',
        status === 'TERMINATED' && 'bg-gray-200 text-gray-500',
        className
      )}
    >
      {status === 'RUNNING' && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
      )}
      {config.label}
    </Badge>
  )
}
