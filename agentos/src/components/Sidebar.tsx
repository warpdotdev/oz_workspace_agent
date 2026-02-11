import { useAgentStore } from '../store';
import type { Agent, AgentStatus } from '../types';

// Status color mapping
const statusColors: Record<AgentStatus, string> = {
  running: 'bg-status-running',
  error: 'bg-status-error',
  idle: 'bg-status-idle',
  paused: 'bg-status-paused',
};

function StatusBadge({ status }: { status: AgentStatus }) {
  return (
    <span 
      className={`inline-block w-2 h-2 rounded-full ${statusColors[status]}`}
      title={status}
    />
  );
}

function AgentListItem({ agent, isSelected, onClick }: { 
  agent: Agent; 
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 text-left rounded-lg transition-colors flex items-center gap-3
        ${isSelected 
          ? 'bg-bg-elevated text-text-primary' 
          : 'hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'
        }`}
    >
      <StatusBadge status={agent.status} />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate text-sm">{agent.name}</div>
        {agent.currentTask && (
          <div className="text-xs text-text-muted truncate">{agent.currentTask}</div>
        )}
      </div>
    </button>
  );
}

export default function Sidebar() {
  const { agents, selectedAgentId, selectAgent } = useAgentStore();

  return (
    <aside className="w-60 flex-shrink-0 bg-bg-secondary border-r border-border-primary flex flex-col pt-8">
      {/* Header */}
      <div className="px-4 pb-4 border-b border-border-primary">
        <h1 className="text-lg font-semibold text-text-primary">AgentOS</h1>
        <p className="text-xs text-text-muted mt-1">Mission Control</p>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="px-2 py-2 text-xs font-medium text-text-muted uppercase tracking-wider">
          Agents ({agents.length})
        </div>
        <div className="space-y-1">
          {agents.length === 0 ? (
            <div className="px-3 py-4 text-sm text-text-muted text-center">
              No agents running
            </div>
          ) : (
            agents.map((agent) => (
              <AgentListItem
                key={agent.id}
                agent={agent}
                isSelected={selectedAgentId === agent.id}
                onClick={() => selectAgent(agent.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer with Cmd+K hint */}
      <div className="p-3 border-t border-border-primary">
        <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
          <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-text-secondary">⌘K</kbd>
          <span>Quick actions</span>
        </div>
      </div>
    </aside>
  );
}
