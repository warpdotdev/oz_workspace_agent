import type { AgentStatus } from "../types";

const statusConfig: Record<AgentStatus, { label: string; dotClass: string; bgClass: string }> = {
  running: {
    label: "Running",
    dotClass: "bg-status-running",
    bgClass: "bg-status-running-muted text-status-running",
  },
  errored: {
    label: "Errored",
    dotClass: "bg-status-errored",
    bgClass: "bg-status-errored-muted text-status-errored",
  },
  deploying: {
    label: "Deploying",
    dotClass: "bg-status-deploying",
    bgClass: "bg-status-deploying-muted text-status-deploying",
  },
  paused: {
    label: "Paused",
    dotClass: "bg-status-paused",
    bgClass: "bg-status-paused-muted text-status-paused",
  },
  stopped: {
    label: "Stopped",
    dotClass: "bg-border-strong",
    bgClass: "bg-surface-elevated text-text-tertiary",
  },
};

interface StatusBadgeProps {
  status: AgentStatus;
  showLabel?: boolean;
}

export function StatusBadge({ status, showLabel = false }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (showLabel) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-2xs font-medium ${config.bgClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`w-2 h-2 rounded-full ${config.dotClass} flex-shrink-0`}
      title={config.label}
    />
  );
}
