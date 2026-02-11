"use client";

import Link from "next/link";
import { AlertTriangle, XCircle, Bot, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentWithMetrics, AgentEvent } from "@/lib/api-client";

interface FailureAlertsProps {
  agents: AgentWithMetrics[];
  recentErrors?: AgentEvent[];
  className?: string;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const eventDate = new Date(date);
  const diffMs = now.getTime() - eventDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return eventDate.toLocaleDateString();
}

export function FailureAlerts({
  agents,
  recentErrors = [],
  className,
}: FailureAlertsProps) {
  // Get agents with failures
  const failingAgents = agents.filter(
    (agent) =>
      agent.status === "ERROR" ||
      agent.metrics?.healthStatus === "UNHEALTHY" ||
      (agent.metrics?.tasksFailed ?? 0) > 0
  );

  const hasFailures = failingAgents.length > 0 || recentErrors.length > 0;

  if (!hasFailures) {
    return (
      <Card className={cn("border-green-200 dark:border-green-800", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Bot className="h-4 w-4" />
            </div>
            All Systems Operational
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No failures or critical issues detected. All agents are running
            normally.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10",
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-4 w-4" />
          </div>
          {failingAgents.length} Issue{failingAgents.length !== 1 ? "s" : ""}{" "}
          Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Failing agents */}
        {failingAgents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-800 bg-background p-3"
          >
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-medium">{agent.name}</p>
                <p className="text-sm text-muted-foreground">
                  {agent.status === "ERROR"
                    ? "Agent in error state"
                    : agent.metrics?.healthStatus === "UNHEALTHY"
                    ? "Unhealthy - requires attention"
                    : `${agent.metrics?.tasksFailed} task${
                        (agent.metrics?.tasksFailed ?? 0) !== 1 ? "s" : ""
                      } failed`}
                </p>
                {agent.metrics?.lastError && (
                  <p className="text-xs text-destructive mt-1 truncate max-w-[300px]">
                    {agent.metrics.lastError}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/agents/${agent.id}`}>
                View
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        ))}

        {/* Recent error events */}
        {recentErrors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recent Errors
            </p>
            {recentErrors.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between text-sm rounded-lg border border-red-200 dark:border-red-800 bg-background p-2"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="truncate max-w-[250px]">{event.message}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
