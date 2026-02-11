"use client";

import {
  Play,
  Square,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Heart,
  Settings,
  LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AgentEvent, EventType, Severity } from "@/lib/api-client";

interface EventTimelineProps {
  events: AgentEvent[];
  showAgentName?: boolean;
  maxEvents?: number;
  className?: string;
}

const eventConfig: Record<
  EventType,
  { icon: LucideIcon; color: string; label: string }
> = {
  STARTED: {
    icon: Play,
    color: "text-green-500",
    label: "Started",
  },
  STOPPED: {
    icon: Square,
    color: "text-gray-500",
    label: "Stopped",
  },
  PAUSED: {
    icon: Pause,
    color: "text-amber-500",
    label: "Paused",
  },
  RESUMED: {
    icon: RotateCcw,
    color: "text-blue-500",
    label: "Resumed",
  },
  TASK_COMPLETED: {
    icon: CheckCircle2,
    color: "text-green-500",
    label: "Task Completed",
  },
  TASK_FAILED: {
    icon: XCircle,
    color: "text-red-500",
    label: "Task Failed",
  },
  ERROR: {
    icon: AlertCircle,
    color: "text-red-500",
    label: "Error",
  },
  WARNING: {
    icon: AlertTriangle,
    color: "text-amber-500",
    label: "Warning",
  },
  HEALTH_CHECK: {
    icon: Heart,
    color: "text-blue-500",
    label: "Health Check",
  },
  CONFIG_CHANGED: {
    icon: Settings,
    color: "text-purple-500",
    label: "Config Changed",
  },
};

const severityStyles: Record<Severity, string> = {
  INFO: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  WARNING:
    "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  ERROR: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  CRITICAL:
    "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700",
};

function formatTimeAgo(date: string): string {
  const now = new Date();
  const eventDate = new Date(date);
  const diffMs = now.getTime() - eventDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return eventDate.toLocaleDateString();
}

export function EventTimeline({
  events,
  showAgentName = false,
  maxEvents = 10,
  className,
}: EventTimelineProps) {
  const displayEvents = events.slice(0, maxEvents);

  if (displayEvents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent events
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Recent Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayEvents.map((event, index) => {
            const config = eventConfig[event.eventType];
            const Icon = config.icon;

            return (
              <div
                key={event.id}
                className={cn(
                  "relative flex gap-3 rounded-lg border p-3 transition-colors",
                  severityStyles[event.severity]
                )}
              >
                {/* Timeline connector */}
                {index < displayEvents.length - 1 && (
                  <div className="absolute left-6 top-12 h-full w-px bg-border" />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background",
                    config.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{config.label}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(event.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {event.message}
                  </p>
                  {showAgentName && event.agentId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Agent: {event.agentId}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
