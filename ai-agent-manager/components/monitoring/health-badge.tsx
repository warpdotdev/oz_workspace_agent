"use client";

import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/lib/api-client";

interface HealthBadgeProps {
  status: HealthStatus;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const healthConfig: Record<
  HealthStatus,
  { label: string; bgColor: string; textColor: string; dotColor: string }
> = {
  HEALTHY: {
    label: "Healthy",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
    dotColor: "bg-green-500",
  },
  DEGRADED: {
    label: "Degraded",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-700 dark:text-amber-300",
    dotColor: "bg-amber-500",
  },
  UNHEALTHY: {
    label: "Unhealthy",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300",
    dotColor: "bg-red-500",
  },
  UNKNOWN: {
    label: "Unknown",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
    dotColor: "bg-gray-500",
  },
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-sm",
};

const dotSizes = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
};

export function HealthBadge({
  status,
  showLabel = true,
  size = "md",
  className,
}: HealthBadgeProps) {
  const config = healthConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("rounded-full", config.dotColor, dotSizes[size])} />
      {showLabel && config.label}
    </span>
  );
}
