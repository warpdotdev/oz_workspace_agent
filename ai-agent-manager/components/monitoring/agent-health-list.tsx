"use client";

import Link from "next/link";
import { Bot, ExternalLink, AlertCircle, Clock, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/agents";
import { HealthBadge } from "./health-badge";
import { cn } from "@/lib/utils";
import type { AgentWithMetrics } from "@/lib/api-client";

interface AgentHealthListProps {
  agents: AgentWithMetrics[];
  className?: string;
}

function formatUptime(uptime: number | null): string {
  if (uptime === null) return "N/A";
  return `${uptime.toFixed(1)}%`;
}

function formatResponseTime(time: number | null): string {
  if (time === null) return "N/A";
  if (time < 1000) return `${Math.round(time)}ms`;
  return `${(time / 1000).toFixed(1)}s`;
}

export function AgentHealthList({ agents, className }: AgentHealthListProps) {
  if (agents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Agent Health</CardTitle>
          <CardDescription>Monitor the health of your agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="rounded-full bg-muted p-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No agents to monitor</p>
            <Button asChild>
              <Link href="/agents/new">Create Agent</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort agents: unhealthy first, then degraded, then by status
  const sortedAgents = [...agents].sort((a, b) => {
    const healthOrder = { UNHEALTHY: 0, DEGRADED: 1, UNKNOWN: 2, HEALTHY: 3 };
    const aHealth = a.metrics?.healthStatus || "UNKNOWN";
    const bHealth = b.metrics?.healthStatus || "UNKNOWN";
    return healthOrder[aHealth] - healthOrder[bHealth];
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Agent Health</CardTitle>
        <CardDescription>
          {agents.length} agent{agents.length !== 1 ? "s" : ""} monitored
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedAgents.map((agent) => (
            <div
              key={agent.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50",
                agent.metrics?.healthStatus === "UNHEALTHY" &&
                  "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10",
                agent.metrics?.healthStatus === "DEGRADED" &&
                  "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"
              )}
            >
              <div className="flex items-center gap-4">
                {/* Agent Icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Bot className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Agent Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="font-medium hover:underline"
                    >
                      {agent.name}
                    </Link>
                    <StatusBadge status={agent.status} showPulse={false} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {agent.type}
                    </Badge>
                    {agent.metrics && (
                      <>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatUptime(agent.metrics.uptime)} uptime
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {formatResponseTime(agent.metrics.avgResponseTime)} avg
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Health Status & Actions */}
              <div className="flex items-center gap-3">
                {/* Error indicator */}
                {agent.metrics?.lastError && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs max-w-[150px] truncate">
                      {agent.metrics.lastError}
                    </span>
                  </div>
                )}

                {/* Health badge */}
                <HealthBadge
                  status={agent.metrics?.healthStatus || "UNKNOWN"}
                />

                {/* Link to details */}
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/agents/${agent.id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
