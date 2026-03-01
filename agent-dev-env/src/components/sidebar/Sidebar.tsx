import {
  Bot,
  ChevronDown,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useAppStore } from "../../store/appStore";
import { FileTree } from "./FileTree";
import type { AgentStatus } from "../../types";

const statusColorMap: Record<AgentStatus, string> = {
  running: "bg-status-running",
  errored: "bg-status-errored",
  deploying: "bg-status-deploying",
  paused: "bg-status-paused",
  stopped: "bg-status-stopped",
};

const statusLabelMap: Record<AgentStatus, string> = {
  running: "Running",
  errored: "Errored",
  deploying: "Deploying",
  paused: "Paused",
  stopped: "Stopped",
};

function WorkspaceSelector() {
  return (
    <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-surface transition-colors duration-[var(--transition-fast)]">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-white text-xs font-semibold">
        A
      </div>
      <span className="flex-1 text-left font-medium truncate">Agent Workspace</span>
      <ChevronDown size={14} className="text-text-tertiary" />
    </button>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) return date.toLocaleDateString();
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "Just now";
}

function AgentList() {
  const agents = useAppStore((s) => s.agents);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const setSelectedAgentId = useAppStore((s) => s.setSelectedAgentId);
  const setCreateAgentModalOpen = useAppStore(
    (s) => s.setCreateAgentModalOpen
  );

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Agents
        </span>
        <button
          onClick={() => setCreateAgentModalOpen(true)}
          className="p-0.5 rounded hover:bg-surface text-text-tertiary hover:text-text-secondary transition-colors duration-[var(--transition-fast)]"
          title="New agent"
        >
          <Plus size={14} />
        </button>
      </div>
      {agents.length === 0 ? (
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-text-tertiary">No agents yet</p>
          <button
            onClick={() => setCreateAgentModalOpen(true)}
            className="text-xs text-accent hover:text-accent-hover mt-1 transition-colors"
          >
            Create your first agent
          </button>
        </div>
      ) : (
        agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setSelectedAgentId(agent.id)}
            className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors duration-[var(--transition-fast)] ${
              selectedAgentId === agent.id
                ? "bg-surface text-text-primary"
                : "text-text-secondary hover:bg-surface hover:text-text-primary"
            }`}
          >
            <Bot size={15} className="shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium text-sm">
                  {agent.name}
                </span>
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${statusColorMap[agent.status]}`}
                  title={statusLabelMap[agent.status]}
                />
              </div>
              <span className="text-xs text-text-tertiary">
                {formatRelativeTime(agent.updatedAt)}
              </span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);

  if (!sidebarOpen) return null;

  return (
    <aside
      className="flex flex-col h-full bg-panel border-r border-border-subtle overflow-hidden"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Workspace Selector */}
      <div className="p-2 border-b border-border-subtle">
        <WorkspaceSelector />
      </div>

      {/* Search */}
      <div className="px-2 pt-2">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-tertiary bg-surface hover:bg-surface-hover transition-colors duration-[var(--transition-fast)]"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-xs text-text-disabled bg-panel px-1.5 py-0.5 rounded border border-border-subtle">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Agent List + File Tree */}
      <div className="flex-1 overflow-y-auto px-1 py-2 flex flex-col gap-4">
        <AgentList />
        {selectedAgentId && <FileTree />}
      </div>

      {/* Bottom Settings */}
      <div className="border-t border-border-subtle p-2 flex flex-col gap-0.5">
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors duration-[var(--transition-fast)]">
          <Settings size={15} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
