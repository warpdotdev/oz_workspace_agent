import { X, Clock, Server, Key, Activity } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { StatusBadge } from "./StatusBadge";

export function RightPanel() {
  const { selectedAgent, setRightPanelOpen } = useAppStore();

  if (!selectedAgent) return null;

  return (
    <div className="flex flex-col h-full bg-surface-raised border-l border-border-subtle animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h2 className="text-sm font-semibold text-text-primary">Agent Details</h2>
        <button
          onClick={() => setRightPanelOpen(false)}
          className="p-1 text-text-tertiary hover:text-text-primary rounded hover:bg-surface-elevated transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Agent Info */}
        <div className="space-y-3">
          <div>
            <label className="text-2xs font-medium text-text-tertiary uppercase tracking-wider">
              Name
            </label>
            <p className="text-sm text-text-primary mt-1">{selectedAgent.name}</p>
          </div>
          <div>
            <label className="text-2xs font-medium text-text-tertiary uppercase tracking-wider">
              Status
            </label>
            <div className="mt-1">
              <StatusBadge status={selectedAgent.status} showLabel />
            </div>
          </div>
          <div>
            <label className="text-2xs font-medium text-text-tertiary uppercase tracking-wider">
              Description
            </label>
            <p className="text-sm text-text-secondary mt-1">{selectedAgent.description}</p>
          </div>
          <div>
            <label className="text-2xs font-medium text-text-tertiary uppercase tracking-wider">
              Last Active
            </label>
            <p className="text-sm text-text-secondary mt-1">{selectedAgent.lastActive}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-2">
          <h3 className="text-2xs font-medium text-text-tertiary uppercase tracking-wider">
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-elevated rounded-md p-3">
              <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
                <Activity size={12} />
                <span className="text-2xs">Runs Today</span>
              </div>
              <span className="text-lg font-semibold text-text-primary">24</span>
            </div>
            <div className="bg-surface-elevated rounded-md p-3">
              <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
                <Clock size={12} />
                <span className="text-2xs">Avg Duration</span>
              </div>
              <span className="text-lg font-semibold text-text-primary">1.2s</span>
            </div>
            <div className="bg-surface-elevated rounded-md p-3">
              <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
                <Server size={12} />
                <span className="text-2xs">Environment</span>
              </div>
              <span className="text-sm font-medium text-text-primary">Production</span>
            </div>
            <div className="bg-surface-elevated rounded-md p-3">
              <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
                <Key size={12} />
                <span className="text-2xs">API Keys</span>
              </div>
              <span className="text-lg font-semibold text-text-primary">3</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-2">
          <h3 className="text-2xs font-medium text-text-tertiary uppercase tracking-wider">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {[
              { action: "Run completed", time: "2 min ago", type: "success" as const },
              { action: "Config updated", time: "15 min ago", type: "info" as const },
              { action: "Deployed to staging", time: "1 hour ago", type: "info" as const },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 text-sm"
              >
                <span className="text-text-secondary">{activity.action}</span>
                <span className="text-2xs text-text-tertiary">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
