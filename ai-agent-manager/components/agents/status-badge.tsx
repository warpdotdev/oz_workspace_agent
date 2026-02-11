"use client";

import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/api-client";

interface StatusBadgeProps {
  status: AgentStatus;
  showPulse?: boolean;
  className?: string;
}

// Semantic status colors per design spec:
// idle (gray), working (blue), paused (amber), error (red), completed/terminated (green)
const statusConfig: Record<
  AgentStatus,
  { label: string; bgColor: string; textColor: string; dotColor: string }
> = {
  IDLE: {
    label: "Idle",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
    dotColor: "bg-gray-500",
  },
  RUNNING: {
    label: "Running",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
    dotColor: "bg-blue-500",
  },
  PAUSED: {
    label: "Paused",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  ERROR: {
    label: "Error",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300",
    dotColor: "bg-red-500",
  },
  TERMINATED: {
    label: "Terminated",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
    dotColor: "bg-green-500",
  },
};

export function StatusBadge({ status, showPulse = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {showPulse && status === "RUNNING" && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.dotColor
            )}
          />
        )}
        <span
          className={cn("relative inline-flex h-2 w-2 rounded-full", config.dotColor)}
        />
      </span>
      {config.label}
    </span>
  );
}
