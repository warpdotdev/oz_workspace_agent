import { useAgentStore } from '../store';
import type { AgentStatus } from '../types';

// Status color mapping for badges
const statusStyles: Record<AgentStatus, { bg: string; text: string; label: string }> = {
  running: { bg: 'bg-status-running/20', text: 'text-status-running', label: 'Running' },
  error: { bg: 'bg-status-error/20', text: 'text-status-error', label: 'Error' },
  idle: { bg: 'bg-status-idle/20', text: 'text-status-idle', label: 'Idle' },
  paused: { bg: 'bg-status-paused/20', text: 'text-status-paused', label: 'Paused' },
};

function formatRuntime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatTokens(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function MainPanel() {
  const { agents, selectedAgentId } = useAgentStore();
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  if (!selectedAgent) {
    return (
      <main className="flex-1 bg-bg-primary flex flex-col items-center justify-center pt-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Welcome to AgentOS
          </h2>
          <p className="text-text-secondary max-w-md">
            Select an agent from the sidebar to view details, or press{' '}
            <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-text-secondary text-sm">⌘K</kbd>
            {' '}to create a new agent.
          </p>
        </div>
      </main>
    );
  }

  const status = statusStyles[selectedAgent.status];

  return (
    <main className="flex-1 bg-bg-primary flex flex-col pt-8 overflow-hidden">
      {/* Agent Header */}
      <header className="px-6 py-4 border-b border-border-primary">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {selectedAgent.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                {status.label}
              </span>
              <span className="text-sm text-text-muted">
                {selectedAgent.model}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm bg-bg-tertiary hover:bg-bg-elevated text-text-secondary hover:text-text-primary rounded-lg transition-colors">
              Pause
            </button>
            <button className="px-3 py-1.5 text-sm bg-status-error/20 hover:bg-status-error/30 text-status-error rounded-lg transition-colors">
              Stop
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4">
        <div className="bg-bg-secondary rounded-lg p-4 border border-border-primary">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Runtime</div>
          <div className="text-lg font-semibold text-text-primary">
            {formatRuntime(selectedAgent.runtime)}
          </div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 border border-border-primary">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Input Tokens</div>
          <div className="text-lg font-semibold text-text-primary">
            {formatTokens(selectedAgent.tokenUsage.input)}
          </div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 border border-border-primary">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Output Tokens</div>
          <div className="text-lg font-semibold text-text-primary">
            {formatTokens(selectedAgent.tokenUsage.output)}
          </div>
        </div>
        <div className="bg-bg-secondary rounded-lg p-4 border border-border-primary">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Current Task</div>
          <div className="text-sm font-medium text-text-primary truncate">
            {selectedAgent.currentTask || 'Idle'}
          </div>
        </div>
      </div>

      {/* Placeholder for charts/metrics */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="bg-bg-secondary rounded-lg border border-border-primary h-64 flex items-center justify-center">
          <div className="text-text-muted text-sm">
            Performance charts will appear here
          </div>
        </div>
      </div>
    </main>
  );
}
