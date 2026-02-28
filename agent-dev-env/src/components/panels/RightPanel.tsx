import { X, Info, Clock, Tag, ExternalLink } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import type { AgentStatus } from "../../types";

const statusBadgeMap: Record<AgentStatus, { bg: string; text: string; label: string }> = {
  running: { bg: "bg-status-running/15", text: "text-status-running", label: "Running" },
  errored: { bg: "bg-status-errored/15", text: "text-status-errored", label: "Errored" },
  deploying: { bg: "bg-status-deploying/15", text: "text-status-deploying", label: "Deploying" },
  paused: { bg: "bg-status-paused/15", text: "text-status-paused", label: "Paused" },
  stopped: { bg: "bg-status-stopped/15", text: "text-status-stopped", label: "Stopped" },
};

export function RightPanel() {
  const rightPanelOpen = useAppStore((s) => s.rightPanelOpen);
  const setRightPanelOpen = useAppStore((s) => s.setRightPanelOpen);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const agents = useAppStore((s) => s.agents);

  if (!rightPanelOpen) return null;

  const agent = agents.find((a) => a.id === selectedAgentId);

  return (
    <aside
      className="flex flex-col h-full bg-panel border-l border-border-subtle overflow-hidden shrink-0"
      style={{ width: "var(--right-panel-width)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-3 border-b border-border-subtle shrink-0">
        <span className="text-sm font-medium text-text-primary">Details</span>
        <button
          onClick={() => setRightPanelOpen(false)}
          className="p-1 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface transition-colors duration-[var(--transition-fast)]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {agent ? (
          <div className="flex flex-col gap-4">
            {/* Agent Info */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-text-primary">{agent.name}</h3>
              {agent.description && (
                <p className="text-xs text-text-secondary leading-relaxed">
                  {agent.description}
                </p>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeMap[agent.status].bg} ${statusBadgeMap[agent.status].text}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {statusBadgeMap[agent.status].label}
              </span>
            </div>

            {/* Metadata */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
              <div className="flex items-center gap-2 text-xs">
                <Info size={12} className="text-text-tertiary shrink-0" />
                <span className="text-text-tertiary">ID:</span>
                <span className="text-text-secondary font-mono">{agent.id}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock size={12} className="text-text-tertiary shrink-0" />
                <span className="text-text-tertiary">Created:</span>
                <span className="text-text-secondary">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock size={12} className="text-text-tertiary shrink-0" />
                <span className="text-text-tertiary">Updated:</span>
                <span className="text-text-secondary">
                  {new Date(agent.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-1 pt-2 border-t border-border-subtle">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">
                Quick Actions
              </span>
              <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-text-secondary hover:bg-surface hover:text-text-primary transition-colors duration-[var(--transition-fast)]">
                <Tag size={12} />
                <span>Add tags</span>
              </button>
              <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-text-secondary hover:bg-surface hover:text-text-primary transition-colors duration-[var(--transition-fast)]">
                <ExternalLink size={12} />
                <span>Open in browser</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
            <p className="text-sm">Select an agent to see details</p>
          </div>
        )}
      </div>
    </aside>
  );
}
