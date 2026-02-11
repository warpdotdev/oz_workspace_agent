import { useAgentStore } from "@/store/agentStore";
import { StatusBadge } from "./StatusBadge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function MainPanel() {
  const { selectedAgentId, agents, metrics, updateAgent } = useAgentStore();

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const agentMetrics = selectedAgentId ? metrics[selectedAgentId] || [] : [];

  // If no agent selected, show dashboard overview
  if (!selectedAgent) {
    return <DashboardOverview />;
  }

  // Show agent detail view
  return (
    <main className="flex-1 bg-background-primary overflow-y-auto">
      {/* Agent Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-text-primary">
                {selectedAgent.config.name}
              </h2>
              <StatusBadge status={selectedAgent.status} />
            </div>
            <p className="text-sm text-text-tertiary mt-1">
              {selectedAgent.config.framework} • {selectedAgent.config.model}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedAgent.status === "running" && (
              <button
                onClick={() => updateAgent(selectedAgent.id, { status: "paused" })}
                className="btn-secondary text-sm"
              >
                <PauseIcon className="w-4 h-4" />
                Pause
              </button>
            )}
            {selectedAgent.status === "paused" && (
              <button
                onClick={() => updateAgent(selectedAgent.id, { status: "running" })}
                className="btn-primary text-sm"
              >
                <PlayIcon className="w-4 h-4" />
                Resume
              </button>
            )}
            {selectedAgent.status === "idle" && (
              <button
                onClick={() => updateAgent(selectedAgent.id, { status: "running" })}
                className="btn-primary text-sm"
              >
                <PlayIcon className="w-4 h-4" />
                Start
              </button>
            )}
            <button
              onClick={() => updateAgent(selectedAgent.id, { status: "idle", currentTask: null })}
              className="btn-ghost text-sm"
            >
              <StopIcon className="w-4 h-4" />
              Stop
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Task */}
        {selectedAgent.currentTask && (
          <section className="card">
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Current Task
            </h3>
            <p className="text-text-primary">{selectedAgent.currentTask}</p>
          </section>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Tokens Used"
            value={formatTokens(selectedAgent.tokensUsed)}
            icon={<TokenIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Runtime"
            value={`${(selectedAgent.runtime / 1000).toFixed(1)}s`}
            icon={<ClockIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Last Activity"
            value={formatTime(selectedAgent.lastActivity)}
            icon={<HeartIcon className="w-5 h-5" />}
          />
        </div>

        {/* Performance Chart */}
        <section className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            Performance
          </h3>
          {agentMetrics.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={agentMetrics.slice(-20)}>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(t) =>
                      new Date(t).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                    stroke="#737373"
                    fontSize={10}
                  />
                  <YAxis stroke="#737373" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1A1A",
                      border: "1px solid #333333",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#A3A3A3" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tokensPerMinute"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-text-tertiary">
              No performance data yet
            </div>
          )}
        </section>

        {/* Configuration */}
        <section className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-4">
            Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-text-tertiary">Model:</span>
              <span className="ml-2 text-text-primary">
                {selectedAgent.config.model}
              </span>
            </div>
            <div>
              <span className="text-text-tertiary">Max Tokens:</span>
              <span className="ml-2 text-text-primary">
                {selectedAgent.config.maxTokens}
              </span>
            </div>
            <div>
              <span className="text-text-tertiary">Temperature:</span>
              <span className="ml-2 text-text-primary">
                {selectedAgent.config.temperature}
              </span>
            </div>
            <div>
              <span className="text-text-tertiary">Tools:</span>
              <span className="ml-2 text-text-primary">
                {selectedAgent.config.tools.join(", ")}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// Dashboard Overview when no agent is selected
function DashboardOverview() {
  const { agents } = useAgentStore();

  const stats = {
    total: agents.length,
    running: agents.filter((a) => a.status === "running").length,
    error: agents.filter((a) => a.status === "error").length,
    totalTokens: agents.reduce((sum, a) => sum + a.tokensUsed, 0),
  };

  return (
    <main className="flex-1 bg-background-primary overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          Dashboard Overview
        </h2>

        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Agents"
            value={stats.total.toString()}
            icon={<AgentIcon className="w-5 h-5" />}
          />
          <StatCard
            label="Running"
            value={stats.running.toString()}
            icon={<PlayIcon className="w-5 h-5" />}
            highlight={stats.running > 0 ? "success" : undefined}
          />
          <StatCard
            label="Errors"
            value={stats.error.toString()}
            icon={<ErrorIcon className="w-5 h-5" />}
            highlight={stats.error > 0 ? "error" : undefined}
          />
          <StatCard
            label="Total Tokens"
            value={formatTokens(stats.totalTokens)}
            icon={<TokenIcon className="w-5 h-5" />}
          />
        </div>

        {/* Quick Start */}
        {agents.length === 0 && (
          <div className="card text-center py-12">
            <AgentIcon className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No agents configured
            </h3>
            <p className="text-text-secondary mb-4">
              Press <kbd className="px-2 py-1 bg-background-tertiary rounded text-sm">⌘K</kbd> to add your first agent
            </p>
          </div>
        )}

        {/* Agent Summary */}
        {agents.length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-4">
              Active Agents
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">
                      {agent.config.name}
                    </span>
                    <StatusBadge status={agent.status} size="sm" />
                  </div>
                  {agent.currentTask && (
                    <p className="text-sm text-text-secondary truncate">
                      {agent.currentTask}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: "success" | "error";
}) {
  const highlightClass =
    highlight === "success"
      ? "text-status-running"
      : highlight === "error"
      ? "text-status-error"
      : "text-text-primary";

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className="text-text-tertiary">{icon}</div>
        <div>
          <p className="text-xs text-text-tertiary">{label}</p>
          <p className={`text-lg font-semibold ${highlightClass}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Icons
function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}

function TokenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function AgentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
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
