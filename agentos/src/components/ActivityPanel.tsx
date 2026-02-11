import { useAgentStore } from "@/store/agentStore";
import { Activity, ActivityType } from "@/types";
import { useState } from "react";

const activityTypeConfig: Record<
  ActivityType,
  { icon: typeof ThoughtIcon; color: string; label: string }
> = {
  thought: {
    icon: ThoughtIcon,
    color: "text-accent-primary",
    label: "Thought",
  },
  action: {
    icon: ActionIcon,
    color: "text-status-running",
    label: "Action",
  },
  observation: {
    icon: ObservationIcon,
    color: "text-status-pending",
    label: "Observation",
  },
  status_change: {
    icon: StatusIcon,
    color: "text-text-secondary",
    label: "Status",
  },
  error: {
    icon: ErrorIcon,
    color: "text-status-error",
    label: "Error",
  },
  task_complete: {
    icon: CompleteIcon,
    color: "text-status-running",
    label: "Complete",
  },
};

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function ActivityItem({ activity }: { activity: Activity }) {
  const config = activityTypeConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className="activity-item animate-fade-in">
      <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-text-primary">
            {activity.agentName}
          </span>
          <span className={`text-[10px] ${config.color}`}>{config.label}</span>
          <span className="text-[10px] text-text-tertiary ml-auto">
            {formatTime(activity.timestamp)}
          </span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {activity.content}
        </p>
      </div>
    </div>
  );
}

export function ActivityPanel() {
  const { activities, selectedAgentId, agents } = useAgentStore();
  const [filter, setFilter] = useState<"all" | "selected">("all");

  const filteredActivities =
    filter === "selected" && selectedAgentId
      ? activities.filter((a) => a.agentId === selectedAgentId)
      : activities;

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <aside className="w-activity flex-shrink-0 bg-surface border-l border-border flex flex-col h-full">
      {/* Header */}
      <div className="panel-header">
        <h2 className="text-sm font-semibold text-text-primary">Activity</h2>
        {selectedAgent && (
          <div className="flex gap-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-1 text-xs rounded ${
                filter === "all"
                  ? "bg-surface-active text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("selected")}
              className={`px-2 py-1 text-xs rounded ${
                filter === "selected"
                  ? "bg-surface-active text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              {selectedAgent.config.name}
            </button>
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <ActivityEmptyIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No activity yet</p>
            <p className="text-xs mt-1">Agent events will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// Icons
function ThoughtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ActionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ObservationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function StatusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function CompleteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ActivityEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
