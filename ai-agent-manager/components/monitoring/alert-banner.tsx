'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Alert } from '@/types/monitoring'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Bot,
  ChevronDown,
  ChevronUp,
  ListTodo,
  X,
} from 'lucide-react'

interface AlertBannerProps {
  alerts: Alert[]
  onDismiss?: (id: string) => void
  onViewResource?: (resourceType: 'agent' | 'task', resourceId: string) => void
}

const severityConfig: Record<
  Alert['severity'],
  { bg: string; border: string; text: string; icon: React.ElementType }
> = {
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: AlertCircle,
  },
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-900 dark:text-red-100',
    icon: AlertCircle,
  },
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

function AlertItem({
  alert,
  onDismiss,
  onViewResource,
}: {
  alert: Alert
  onDismiss?: (id: string) => void
  onViewResource?: (resourceType: 'agent' | 'task', resourceId: string) => void
}) {
  const config = severityConfig[alert.severity]
  const SeverityIcon = config.icon
  const ResourceIcon = alert.resourceType === 'agent' ? Bot : ListTodo

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        config.bg,
        config.border
      )}
    >
      <SeverityIcon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.text)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn('text-sm font-medium', config.text)}>{alert.title}</p>
          <Badge
            variant="outline"
            className={cn('text-xs capitalize', config.text, config.border)}
          >
            {alert.severity}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(alert.timestamp)}
          </span>
          <Button
            variant="ghost"
            size="xs"
            className={cn('text-xs', config.text)}
            onClick={() => onViewResource?.(alert.resourceType, alert.resourceId)}
          >
            <ResourceIcon className="h-3 w-3 mr-1" />
            View {alert.resourceType}
          </Button>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        className={config.text}
        onClick={() => onDismiss?.(alert.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function AlertBanner({
  alerts,
  onDismiss,
  onViewResource,
}: AlertBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const activeAlerts = alerts.filter((a) => !a.dismissed)

  if (activeAlerts.length === 0) {
    return null
  }

  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length
  const errorCount = activeAlerts.filter((a) => a.severity === 'error').length
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length

  // Determine overall severity for the banner header
  const overallSeverity: Alert['severity'] =
    criticalCount > 0 ? 'critical' : errorCount > 0 ? 'error' : 'warning'
  const headerConfig = severityConfig[overallSeverity]

  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden',
        headerConfig.bg,
        headerConfig.border
      )}
    >
      {/* Header */}
      <button
        className={cn(
          'w-full flex items-center justify-between p-3',
          headerConfig.text
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="font-medium text-sm">
            {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {criticalCount > 0 && (
              <Badge className="bg-red-600 text-white text-xs">
                {criticalCount} critical
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {errorCount} error
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-amber-500 text-white text-xs">
                {warningCount} warning
              </Badge>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Alert List */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {activeAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={onDismiss}
              onViewResource={onViewResource}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Compact notification badge for showing alert count in header
export function AlertNotificationBadge({ count }: { count: number }) {
  if (count === 0) return null

  return (
    <Badge
      variant="destructive"
      className="h-5 min-w-5 flex items-center justify-center p-0 text-xs"
    >
      {count > 99 ? '99+' : count}
    </Badge>
  )
}
