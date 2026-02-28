import {
  Bot,
  ChevronDown,
  FileText,
  FolderTree,
  Plus,
  Search,
  Settings,
  Brain,
  Zap,
} from "lucide-react";
import { useAppStore } from "../store/appStore";
import { StatusBadge } from "./StatusBadge";

export function Sidebar() {
  const {
    activeWorkspace,
    agents,
    selectedAgent,
    setSelectedAgent,
    setCommandPaletteOpen,
  } = useAppStore();

  return (
    <div className="flex flex-col h-full bg-surface-raised border-r border-border-subtle">
      {/* Workspace Selector */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border-subtle">
        <button className="flex items-center gap-2 text-sm font-medium text-text-primary hover:text-accent transition-colors">
          <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
            <span className="text-2xs font-bold text-white">
              {activeWorkspace?.name.charAt(0) ?? "W"}
            </span>
          </div>
          <span className="truncate max-w-[140px]">{activeWorkspace?.name ?? "Workspace"}</span>
          <ChevronDown size={14} className="text-text-tertiary" />
        </button>
      </div>

      {/* Quick Search */}
      <div className="px-3 py-2">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-text-tertiary bg-surface-elevated rounded hover:bg-surface-overlay transition-colors"
        >
          <Search size={14} />
          <span>Search...</span>
          <kbd className="ml-auto text-2xs text-text-disabled bg-surface-base px-1 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="sidebar-section-header !px-0 !py-0">Agents</span>
          <button className="p-1 text-text-tertiary hover:text-text-primary rounded hover:bg-surface-elevated transition-colors">
            <Plus size={14} />
          </button>
        </div>

        <div className="px-1.5 space-y-0.5">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`sidebar-item w-full ${
                selectedAgent?.id === agent.id ? "active" : ""
              }`}
            >
              <StatusBadge status={agent.status} />
              <Bot size={14} className="flex-shrink-0" />
              <span className="truncate">{agent.name}</span>
            </button>
          ))}
        </div>

        {/* File Tree Placeholder */}
        <div className="mt-4">
          <div className="px-3 py-2">
            <span className="sidebar-section-header !px-0 !py-0">Files</span>
          </div>
          <div className="px-1.5 space-y-0.5">
            <button className="sidebar-item w-full">
              <FileText size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="truncate">README.md</span>
            </button>
            <button className="sidebar-item w-full">
              <FolderTree size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="truncate">memory/</span>
            </button>
            <button className="sidebar-item w-full">
              <Brain size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="truncate">skills/</span>
            </button>
            <button className="sidebar-item w-full">
              <Zap size={14} className="text-text-tertiary flex-shrink-0" />
              <span className="truncate">workflows/</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="border-t border-border-subtle px-1.5 py-2">
        <button className="sidebar-item w-full">
          <Settings size={14} className="text-text-tertiary flex-shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
