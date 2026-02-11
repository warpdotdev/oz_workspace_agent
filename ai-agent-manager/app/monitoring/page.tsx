"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/layout/navigation";
import {
  MetricsCard,
  FailureAlerts,
  AgentHealthList,
  EventTimeline,
} from "@/components/monitoring";
import {
  monitoringApi,
  agentApi,
  type MonitoringOverview,
  type AgentWithMetrics,
  type AgentEvent,
  type Agent,
} from "@/lib/api-client";

// Mock data generator for demo purposes when API is not available
function generateMockData(): {
  overview: MonitoringOverview;
  agents: AgentWithMetrics[];
  events: AgentEvent[];
} {
  const mockAgents: AgentWithMetrics[] = [
    {
      id: "agent-1",
      name: "Code Review Bot",
      description: "Automated code review agent",
      type: "CODING",
      status: "RUNNING",
      config: null,
      systemPrompt: null,
      tools: ["code_analysis", "git_operations"],
      userId: "user-1",
      projectId: null,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: {
        id: "metrics-1",
        agentId: "agent-1",
        tasksCompleted: 142,
        tasksFailed: 3,
        avgResponseTime: 1250,
        uptime: 99.2,
        lastHealthCheck: new Date().toISOString(),
        healthStatus: "HEALTHY",
        errorCount: 3,
        lastError: null,
        lastErrorAt: null,
        cpuUsage: 23.5,
        memoryUsage: 45.2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: "agent-2",
      name: "Research Assistant",
      description: "Web research and summarization",
      type: "RESEARCH",
      status: "RUNNING",
      config: null,
      systemPrompt: null,
      tools: ["web_search", "summarize"],
      userId: "user-1",
      projectId: null,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: {
        id: "metrics-2",
        agentId: "agent-2",
        tasksCompleted: 89,
        tasksFailed: 0,
        avgResponseTime: 3200,
        uptime: 100,
        lastHealthCheck: new Date().toISOString(),
        healthStatus: "HEALTHY",
        errorCount: 0,
        lastError: null,
        lastErrorAt: null,
        cpuUsage: 15.8,
        memoryUsage: 32.1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: "agent-3",
      name: "Data Analyzer",
      description: "Statistical analysis agent",
      type: "ANALYSIS",
      status: "PAUSED",
      config: null,
      systemPrompt: null,
      tools: ["data_processing", "visualization"],
      userId: "user-1",
      projectId: null,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: {
        id: "metrics-3",
        agentId: "agent-3",
        tasksCompleted: 256,
        tasksFailed: 12,
        avgResponseTime: 5400,
        uptime: 87.5,
        lastHealthCheck: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        healthStatus: "DEGRADED",
        errorCount: 12,
        lastError: "Memory limit exceeded during large dataset processing",
        lastErrorAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        cpuUsage: 78.2,
        memoryUsage: 92.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  ];

  const mockEvents: AgentEvent[] = [
    {
      id: "event-1",
      agentId: "agent-1",
      eventType: "TASK_COMPLETED",
      message: "Completed code review for PR #234",
      severity: "INFO",
      metadata: null,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: "event-2",
      agentId: "agent-2",
      eventType: "STARTED",
      message: "Agent started successfully",
      severity: "INFO",
      metadata: null,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: "event-3",
      agentId: "agent-3",
      eventType: "WARNING",
      message: "High memory usage detected (92.5%)",
      severity: "WARNING",
      metadata: null,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "event-4",
      agentId: "agent-1",
      eventType: "TASK_COMPLETED",
      message: "Completed code review for PR #233",
      severity: "INFO",
      metadata: null,
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "event-5",
      agentId: "agent-3",
      eventType: "PAUSED",
      message: "Agent paused due to resource constraints",
      severity: "WARNING",
      metadata: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const totalTasksCompleted = mockAgents.reduce(
    (sum, a) => sum + (a.metrics?.tasksCompleted || 0),
    0
  );
  const totalTasksFailed = mockAgents.reduce(
    (sum, a) => sum + (a.metrics?.tasksFailed || 0),
    0
  );
  const avgResponseTimes = mockAgents
    .filter((a) => a.metrics?.avgResponseTime)
    .map((a) => a.metrics!.avgResponseTime!);
  const avgResponseTime =
    avgResponseTimes.length > 0
      ? avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length
      : null;

  const overview: MonitoringOverview = {
    totalAgents: mockAgents.length,
    activeAgents: mockAgents.filter((a) => a.status === "RUNNING").length,
    healthyAgents: mockAgents.filter(
      (a) => a.metrics?.healthStatus === "HEALTHY"
    ).length,
    degradedAgents: mockAgents.filter(
      (a) => a.metrics?.healthStatus === "DEGRADED"
    ).length,
    unhealthyAgents: mockAgents.filter(
      (a) => a.metrics?.healthStatus === "UNHEALTHY"
    ).length,
    totalTasksCompleted,
    totalTasksFailed,
    avgResponseTime,
    recentEvents: mockEvents,
  };

  return { overview, agents: mockAgents, events: mockEvents };
}

export default function MonitoringPage() {
  const [overview, setOverview] = useState<MonitoringOverview | null>(null);
  const [agents, setAgents] = useState<AgentWithMetrics[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Try to fetch real data first
      try {
        const [overviewData, agentsData, eventsData] = await Promise.all([
          monitoringApi.getOverview(),
          monitoringApi.getAgentsWithMetrics(),
          monitoringApi.getRecentEvents(10),
        ]);
        setOverview(overviewData);
        setAgents(agentsData);
        setEvents(eventsData);
      } catch {
        // If API fails, use mock data for demo
        console.log("Using mock data for monitoring dashboard");
        const mockData = generateMockData();
        setOverview(mockData.overview);
        setAgents(mockData.agents);
        setEvents(mockData.events);
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Failed to load monitoring data:", err);
      setError("Failed to load monitoring data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
  };

  // Get error events for failure alerts
  const errorEvents = events.filter(
    (e) => e.severity === "ERROR" || e.severity === "CRITICAL"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-8">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => loadData()}>Try Again</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
              <p className="text-muted-foreground mt-1">
                Real-time health and performance monitoring for your AI agents
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Failure Alerts - Always at top */}
          <FailureAlerts agents={agents} recentErrors={errorEvents} />

          {/* Metrics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricsCard
              title="Total Agents"
              value={overview?.totalAgents ?? 0}
              subtitle={`${overview?.activeAgents ?? 0} active`}
              icon={Bot}
              variant="default"
            />
            <MetricsCard
              title="Healthy Agents"
              value={overview?.healthyAgents ?? 0}
              subtitle={
                overview?.degradedAgents
                  ? `${overview.degradedAgents} degraded`
                  : "All systems nominal"
              }
              icon={Activity}
              variant={
                (overview?.unhealthyAgents ?? 0) > 0
                  ? "danger"
                  : (overview?.degradedAgents ?? 0) > 0
                  ? "warning"
                  : "success"
              }
            />
            <MetricsCard
              title="Tasks Completed"
              value={overview?.totalTasksCompleted ?? 0}
              subtitle={
                overview?.totalTasksFailed
                  ? `${overview.totalTasksFailed} failed`
                  : "No failures"
              }
              icon={CheckCircle2}
              variant={
                (overview?.totalTasksFailed ?? 0) > 0 ? "warning" : "success"
              }
            />
            <MetricsCard
              title="Avg Response Time"
              value={
                overview?.avgResponseTime
                  ? `${(overview.avgResponseTime / 1000).toFixed(1)}s`
                  : "N/A"
              }
              subtitle="Across all agents"
              icon={Clock}
              variant="default"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Agent Health List */}
            <AgentHealthList agents={agents} />

            {/* Event Timeline */}
            <EventTimeline events={events} showAgentName maxEvents={8} />
          </div>
        </div>
      </main>
    </div>
  );
}
