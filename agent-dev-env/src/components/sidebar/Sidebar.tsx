import {
  Bot,
  ChevronDown,
  FileText,
  FolderClosed,
  FolderOpen,
  Plus,
  Search,
  Settings,
  Brain,
  Zap,
} from "lucide-react";
import { useAppStore } from "../../store/appStore";
import type { AgentStatus } from "../../types";

const statusColorMap: Record<AgentStatus, string> = {
  running: "bg-status-running",
  errored: "bg-status-errored",
  deploying: "bg-status-deploying",
  paused: "bg-status-paused",
  stopped: "bg-status-stopped",
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

function AgentList() {
  const agents = useAppStore((s) => s.agents);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const setSelectedAgentId = useAppStore((s) => s.setSelectedAgentId);

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Agents
        </span>
        <button className="p-0.5 rounded hover:bg-surface text-text-tertiary hover:text-text-secondary transition-colors duration-[var(--transition-fast)]">
          <Plus size={14} />
        </button>
      </div>
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => setSelectedAgentId(agent.id)}
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors duration-[var(--transition-fast)] ${
            selectedAgentId === agent.id
              ? "bg-surface text-text-primary"
              : "text-text-secondary hover:bg-surface hover:text-text-primary"
          }`}
        >
          <Bot size={15} className="shrink-0" />
          <span className="flex-1 text-left truncate">{agent.name}</span>
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${statusColorMap[agent.status]}`}
            title={agent.status}
          />
        </button>
      ))}
    </div>
  );
}

function FileTree() {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          Files
        </span>
      </div>
      <div className="flex flex-col gap-0.5 text-sm text-text-secondary">
        <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-surface transition-colors duration-[var(--transition-fast)]">
          <FolderOpen size={14} className="text-accent-text shrink-0" />
          <span>markdown</span>
        </button>
        <button className="flex items-center gap-2 rounded-md px-2 py-1 pl-6 hover:bg-surface transition-colors duration-[var(--transition-fast)]">
          <FileText size={14} className="shrink-0" />
          <span>README.md</span>
        </button>
        <button className="flex items-center gap-2 rounded-md px-2 py-1 pl-6 hover:bg-surface transition-colors duration-[var(--transition-fast)]">
          <FileText size={14} className="shrink-0" />
          <span>instructions.md</span>
        </button>
        <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-surface transition-colors duration-[var(--transition-fast)]">
          <FolderClosed size={14} className="text-text-tertiary shrink-0" />
          <span>memory</span>
        </button>
        <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-surface transition-colors duration-[var(--transition-fast)]">
          <FolderClosed size={14} className="text-text-tertiary shrink-0" />
          <span>skills</span>
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);

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

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto px-1 py-2 flex flex-col gap-4">
        <AgentList />
        <FileTree />
      </div>

      {/* Bottom Settings */}
      <div className="border-t border-border-subtle p-2 flex flex-col gap-0.5">
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors duration-[var(--transition-fast)]">
          <Brain size={15} />
          <span>Memory</span>
        </button>
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors duration-[var(--transition-fast)]">
          <Zap size={15} />
          <span>Skills</span>
        </button>
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors duration-[var(--transition-fast)]">
          <Settings size={15} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
