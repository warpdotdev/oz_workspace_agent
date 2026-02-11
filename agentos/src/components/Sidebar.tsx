import { useAgentStore } from "@/store/agentStore";
import { AgentCard } from "./AgentCard";

export function Sidebar() {
  const { agents, toggleCommandBar } = useAgentStore();

  const runningCount = agents.filter((a) => a.status === "running").length;
  const errorCount = agents.filter((a) => a.status === "error").length;

  return (
    <aside className="w-sidebar flex-shrink-0 bg-surface border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="panel-header">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">AgentOS</h1>
          <p className="text-xs text-text-tertiary mt-0.5">
            {agents.length} agents • {runningCount} running
            {errorCount > 0 && (
              <span className="text-status-error ml-1">• {errorCount} error</span>
            )}
          </p>
        </div>
        <button
          onClick={() => toggleCommandBar()}
          className="btn-ghost p-2"
          title="Quick Commands (⌘K)"
        >
          <CommandIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {agents.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary">
            <AgentEmptyIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No agents configured</p>
            <p className="text-xs mt-1">Press ⌘K to add an agent</p>
          </div>
        ) : (
          agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => toggleCommandBar()}
          className="w-full btn-secondary text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Add Agent
        </button>
      </div>
    </aside>
  );
}

// Icons
function CommandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function AgentEmptyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}
