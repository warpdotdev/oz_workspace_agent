import { Agent } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { useAgentStore } from "@/store/agentStore";

interface AgentCardProps {
  agent: Agent;
}

function formatRuntime(startedAt: Date | null): string {
  if (!startedAt) return "-";
  const diff = Date.now() - new Date(startedAt).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { selectedAgentId, selectAgent } = useAgentStore();
  const isSelected = selectedAgentId === agent.id;

  return (
    <div
      onClick={() => selectAgent(agent.id)}
      className={`card-interactive ${
        isSelected
          ? "border-accent-primary bg-surface-active"
          : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary truncate">
            {agent.name}
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">{agent.framework}</p>
        </div>
        <StatusBadge status={agent.status} size="sm" />
      </div>

      {agent.currentTask && (
        <p className="text-sm text-text-secondary truncate-2 mb-3">
          {agent.currentTask}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1">
          <ClockIcon className="w-3.5 h-3.5" />
          <span>{formatRuntime(agent.startedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <TokenIcon className="w-3.5 h-3.5" />
          <span>{formatTokens(agent.tokensUsed)}</span>
        </div>
        <div className="flex items-center gap-1">
          <CostIcon className="w-3.5 h-3.5" />
          <span>{formatCost(agent.estimatedCost)}</span>
        </div>
      </div>
    </div>
  );
}

// Simple icon components (SF Symbol style)
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TokenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function CostIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
