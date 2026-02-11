'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sidebar } from '@/components/layout/sidebar'
import {
  ActivityFeed,
  AgentHealthList,
  MetricsPanel,
  AlertBanner,
  FailedTaskList,
  FailureDetail,
} from '@/components/monitoring'
import type { MonitoringData, FailedTask, Alert } from '@/types/monitoring'
import {
  Activity,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react'

const DEFAULT_POLL_INTERVAL = 10000 // 10 seconds

export default function MonitoringPage() {
  const router = useRouter()
  const [data, setData] = useState<MonitoringData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const [pollInterval, setPollInterval] = useState(DEFAULT_POLL_INTERVAL)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Failure detail modal state
  const [selectedFailedTask, setSelectedFailedTask] = useState<FailedTask | null>(null)
  const [isFailureDetailOpen, setIsFailureDetailOpen] = useState(false)

  // Local alert dismissal state (persists only during session)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const fetchMonitoringData = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring')

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error('Failed to fetch monitoring data')
      }

      const result: MonitoringData = await response.json()
      setData(result)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('Monitoring fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Initial fetch and polling
  useEffect(() => {
    fetchMonitoringData()

    if (!isPolling) return

    const intervalId = setInterval(fetchMonitoringData, pollInterval)
    return () => clearInterval(intervalId)
  }, [fetchMonitoringData, isPolling, pollInterval])

  // Handle alert dismissal
  const handleDismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
  }, [])

  // Handle viewing resource from alert
  const handleViewResource = useCallback(
    (resourceType: 'agent' | 'task', resourceId: string) => {
      if (resourceType === 'agent') {
        router.push(`/agents/${resourceId}`)
      } else {
        router.push(`/tasks/${resourceId}`)
      }
    },
    [router]
  )

  // Handle retry failed task
  const handleRetryTask = useCallback(
    async (_taskId: string) => {
      try {
        // In a real implementation, this would call the retry API
        toast.success('Task retry initiated')
        fetchMonitoringData()
      } catch {
        toast.error('Failed to retry task')
      }
    },
    [fetchMonitoringData]
  )

  // Handle delete failed task
  const handleDeleteTask = useCallback(
    async (_taskId: string) => {
      try {
        // In a real implementation, this would call the delete API
        toast.success('Task deleted')
        fetchMonitoringData()
      } catch {
        toast.error('Failed to delete task')
      }
    },
    [fetchMonitoringData]
  )

  // Handle agent actions
  const handleStartAgent = useCallback(async (agentId: string) => {
    toast.info(`Starting agent ${agentId}...`)
    // API call would go here
  }, [])

  const handlePauseAgent = useCallback(async (agentId: string) => {
    toast.info(`Pausing agent ${agentId}...`)
    // API call would go here
  }, [])

  const handleStopAgent = useCallback(async (agentId: string) => {
    toast.info(`Stopping agent ${agentId}...`)
    // API call would go here
  }, [])

  const handleViewAgentDetails = useCallback(
    (agentId: string) => {
      router.push(`/agents/${agentId}`)
    },
    [router]
  )

  // Filter out dismissed alerts
  const activeAlerts: Alert[] =
    data?.alerts
      .filter((a) => !dismissedAlerts.has(a.id))
      .map((a) => ({ ...a, dismissed: false })) ?? []

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never'
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)
    if (diffSec < 5) return 'Just now'
    if (diffSec < 60) return `${diffSec}s ago`
    return `${Math.floor(diffSec / 60)}m ago`
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Monitoring Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time agent and task monitoring
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Live indicator */}
              <div className="flex items-center gap-2 text-sm">
                {isPolling ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Live</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                    <WifiOff className="h-4 w-4 text-gray-400" />
                    <span className="text-muted-foreground">Paused</span>
                  </>
                )}
                <span className="text-xs text-muted-foreground">
                  Updated {formatLastUpdated()}
                </span>
              </div>

              {/* Polling toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPolling(!isPolling)}
              >
                {isPolling ? 'Pause' : 'Resume'}
              </Button>

              {/* Manual refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMonitoringData}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>

              {/* Settings - poll interval */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const intervals = [5000, 10000, 30000, 60000]
                  const current = intervals.indexOf(pollInterval)
                  const next = intervals[(current + 1) % intervals.length]
                  setPollInterval(next)
                  toast.info(`Poll interval: ${next / 1000}s`)
                }}
                title={`Poll interval: ${pollInterval / 1000}s (click to change)`}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                Error loading monitoring data: {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchMonitoringData}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Alerts Banner */}
          {activeAlerts.length > 0 && (
            <AlertBanner
              alerts={activeAlerts}
              onDismiss={handleDismissAlert}
              onViewResource={handleViewResource}
            />
          )}

          {/* Metrics Overview */}
          <section>
            <MetricsPanel
              metrics={data?.systemMetrics ?? null}
              isLoading={isLoading}
            />
          </section>

          {/* Agent Health Grid */}
          <section>
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              Agent Health
              {data?.agentHealth && data.agentHealth.length > 0 && (
                <Badge variant="secondary">{data.agentHealth.length}</Badge>
              )}
            </h2>
            <AgentHealthList
              agents={data?.agentHealth ?? []}
              isLoading={isLoading}
              onStart={handleStartAgent}
              onPause={handlePauseAgent}
              onStop={handleStopAgent}
              onViewDetails={handleViewAgentDetails}
            />
          </section>

          {/* Activity and Failures Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <section>
              <ActivityFeed
                events={data?.recentEvents ?? []}
                isLoading={isLoading}
                maxHeight="400px"
              />
            </section>

            {/* Failed Tasks */}
            <section>
              <FailedTaskList
                tasks={data?.failedTasks ?? []}
                isLoading={isLoading}
                onSelectTask={(task) => {
                  setSelectedFailedTask(task)
                  setIsFailureDetailOpen(true)
                }}
                onRetry={handleRetryTask}
              />
            </section>
          </div>
        </div>
      </main>

      {/* Failure Detail Modal */}
      <FailureDetail
        task={selectedFailedTask}
        open={isFailureDetailOpen}
        onOpenChange={setIsFailureDetailOpen}
        onRetry={handleRetryTask}
        onDelete={handleDeleteTask}
      />
    </div>
  )
}
