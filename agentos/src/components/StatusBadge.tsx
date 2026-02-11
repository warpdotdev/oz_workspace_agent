import { AgentStatus } from "@/types";

interface StatusBadgeProps {
  status: AgentStatus;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<
  AgentStatus,
  { color: string; bgColor: string; label: string; dotClass: string }
> = {
  running: {
    color: "text-status-running",
    bgColor: "bg-status-running/10",
    label: "Running",
    dotClass: "bg-status-running animate-pulse",
  },
  error: {
    color: "text-status-error",
    bgColor: "bg-status-error/10",
    label: "Error",
    dotClass: "bg-status-error",
  },
  idle: {
    color: "text-status-idle",
    bgColor: "bg-status-idle/10",
    label: "Idle",
    dotClass: "bg-status-idle",
  },
  paused: {
    color: "text-status-paused",
    bgColor: "bg-status-paused/10",
    label: "Paused",
    dotClass: "bg-status-paused",
  },
};

const sizeClasses = {
  sm: {
    badge: "px-1.5 py-0.5 text-[10px]",
    dot: "w-1.5 h-1.5",
  },
  md: {
    badge: "px-2 py-0.5 text-xs",
    dot: "w-2 h-2",
  },
  lg: {
    badge: "px-2.5 py-1 text-sm",
    dot: "w-2.5 h-2.5",
  },
};

export function StatusBadge({
  status,
  showLabel = true,
  size = "md",
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClass.badge}`}
    >
      <span className={`rounded-full ${config.dotClass} ${sizeClass.dot}`} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

// Standalone dot indicator for compact views
export function StatusDot({
  status,
  size = "md",
}: {
  status: AgentStatus;
  size?: "sm" | "md" | "lg";
}) {
  const config = statusConfig[status];
  const dotSize = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  return (
    <span
      className={`inline-block rounded-full ${config.dotClass} ${dotSize[size]}`}
      title={config.label}
    />
  );
}
