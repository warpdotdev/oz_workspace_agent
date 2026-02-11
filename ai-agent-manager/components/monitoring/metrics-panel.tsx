'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { SystemMetrics } from '@/types/monitoring'
import {
  Bot,
  CheckCircle,
  Clock,
  ListTodo,
  Play,
  AlertCircle,
  TrendingUp,
  Zap,
} from 'lucide-react'

interface MetricsPanelProps {
  metrics: SystemMetrics | null
  isLoading?: boolean
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  iconColor?: string
  trend?: number
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs mt-2',
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            <TrendingUp
              className={cn('h-3 w-3', trend < 0 && 'rotate-180')}
            />
            <span>{Math.abs(trend)}% from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function MetricsPanel({ metrics, isLoading = false }: MetricsPanelProps) {
  if (isLoading || !metrics) {
    return <LoadingSkeleton />
  }

  const { agents, tasks } = metrics

  return (
    <div className="space-y-4">
      {/* Agent Metrics */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Agent Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            title="Total Agents"
            value={agents.total}
            icon={Bot}
            iconColor="text-primary"
          />
          <MetricCard
            title="Running"
            value={agents.running}
            subtitle={
              agents.total > 0
                ? `${Math.round((agents.running / agents.total) * 100)}% of total`
                : undefined
            }
            icon={Play}
            iconColor="text-blue-600"
          />
          <MetricCard
            title="Idle"
            value={agents.idle}
            icon={Clock}
            iconColor="text-gray-500"
          />
          <MetricCard
            title="Paused"
            value={agents.paused}
            icon={Clock}
            iconColor="text-amber-500"
          />
          <MetricCard
            title="In Error"
            value={agents.error}
            subtitle={agents.error > 0 ? 'Needs attention' : 'All healthy'}
            icon={AlertCircle}
            iconColor={agents.error > 0 ? 'text-red-600' : 'text-green-600'}
          />
        </div>
      </div>

      {/* Task Metrics */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          Task Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            title="Total Tasks"
            value={tasks.total}
            icon={ListTodo}
            iconColor="text-primary"
          />
          <MetricCard
            title="In Progress"
            value={tasks.running}
            subtitle={tasks.queued > 0 ? `${tasks.queued} queued` : undefined}
            icon={Zap}
            iconColor="text-blue-600"
          />
          <MetricCard
            title="Completed"
            value={tasks.completed}
            icon={CheckCircle}
            iconColor="text-green-600"
          />
          <MetricCard
            title="Failed"
            value={tasks.failed + tasks.cancelled}
            subtitle={
              tasks.failed + tasks.cancelled > 0 ? 'Review needed' : 'No failures'
            }
            icon={AlertCircle}
            iconColor={
              tasks.failed + tasks.cancelled > 0 ? 'text-red-600' : 'text-green-600'
            }
          />
          <MetricCard
            title="Completion Rate"
            value={`${tasks.completionRate}%`}
            subtitle={
              tasks.completionRate >= 80
                ? 'Good performance'
                : tasks.completionRate >= 50
                  ? 'Needs improvement'
                  : 'Critical'
            }
            icon={TrendingUp}
            iconColor={
              tasks.completionRate >= 80
                ? 'text-green-600'
                : tasks.completionRate >= 50
                  ? 'text-amber-600'
                  : 'text-red-600'
            }
          />
        </div>
      </div>

      {/* Performance Metrics */}
      {(metrics.avgLatency !== null || metrics.avgSuccessRate !== null) && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.avgLatency !== null && (
              <MetricCard
                title="Avg Latency"
                value={`${metrics.avgLatency.toFixed(0)}ms`}
                icon={Clock}
                iconColor={
                  metrics.avgLatency < 1000
                    ? 'text-green-600'
                    : metrics.avgLatency < 3000
                      ? 'text-amber-600'
                      : 'text-red-600'
                }
              />
            )}
            {metrics.avgSuccessRate !== null && (
              <MetricCard
                title="Avg Success Rate"
                value={`${metrics.avgSuccessRate.toFixed(1)}%`}
                icon={CheckCircle}
                iconColor={
                  metrics.avgSuccessRate >= 90
                    ? 'text-green-600'
                    : metrics.avgSuccessRate >= 70
                      ? 'text-amber-600'
                      : 'text-red-600'
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
