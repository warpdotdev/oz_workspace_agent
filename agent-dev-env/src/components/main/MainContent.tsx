import React from "react";
import {
  FileEdit,
  Calendar,
  Shield,
  Server,
  Activity,
  PanelRight,
  PanelLeft,
  Bot,
} from "lucide-react";
import { useAppStore } from "../../store/appStore";
import type { TabId, AgentStatus } from "../../types";

const tabs: { id: TabId; label: string; icon: typeof FileEdit }[] = [
  { id: "editor", label: "Editor", icon: FileEdit },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "identity", label: "Identity", icon: Shield },
  { id: "environments", label: "Environments", icon: Server },
  { id: "observe", label: "Observe", icon: Activity },
];

const statusLabelMap: Record<AgentStatus, string> = {
  running: "Running",
  errored: "Errored",
  deploying: "Deploying",
  paused: "Paused",
  stopped: "Stopped",
};

const statusColorMap: Record<AgentStatus, string> = {
  running: "text-status-running",
  errored: "text-status-errored",
  deploying: "text-status-deploying",
  paused: "text-status-paused",
  stopped: "text-status-stopped",
};

function TabBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="flex items-center gap-0.5 px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors duration-[var(--transition-fast)] ${
              isActive
                ? "bg-surface text-text-primary"
                : "text-text-tertiary hover:text-text-secondary hover:bg-surface/50"
            }`}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function EditorPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-3">
      <FileEdit size={48} strokeWidth={1} className="text-border" />
      <div className="text-center">
        <p className="text-text-secondary font-medium">Markdown Editor</p>
        <p className="text-sm mt-1">Select a file to start editing</p>
      </div>
    </div>
  );
}

function SchedulePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-3">
      <Calendar size={48} strokeWidth={1} className="text-border" />
      <div className="text-center">
        <p className="text-text-secondary font-medium">Schedule Management</p>
        <p className="text-sm mt-1">Configure when your agent runs</p>
      </div>
    </div>
  );
}

function IdentityPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-3">
      <Shield size={48} strokeWidth={1} className="text-border" />
      <div className="text-center">
        <p className="text-text-secondary font-medium">Identity & Access</p>
        <p className="text-sm mt-1">Manage API keys, roles, and permissions</p>
      </div>
    </div>
  );
}

function EnvironmentsPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-3">
      <Server size={48} strokeWidth={1} className="text-border" />
      <div className="text-center">
        <p className="text-text-secondary font-medium">Environments</p>
        <p className="text-sm mt-1">Manage dev, staging, and production environments</p>
      </div>
    </div>
  );
}

function ObservePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-3">
      <Activity size={48} strokeWidth={1} className="text-border" />
      <div className="text-center">
        <p className="text-text-secondary font-medium">Observability</p>
        <p className="text-sm mt-1">Monitor logs, metrics, and traces</p>
      </div>
    </div>
  );
}

const tabContent: Record<TabId, () => React.JSX.Element> = {
  editor: EditorPlaceholder,
  schedule: SchedulePlaceholder,
  identity: IdentityPlaceholder,
  environments: EnvironmentsPlaceholder,
  observe: ObservePlaceholder,
};

export function MainContent() {
  const activeTab = useAppStore((s) => s.activeTab);
  const selectedAgentId = useAppStore((s) => s.selectedAgentId);
  const agents = useAppStore((s) => s.agents);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const toggleRightPanel = useAppStore((s) => s.toggleRightPanel);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const ActiveContent = tabContent[activeTab];

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-base">
      {/* Top Bar */}
      <div className="flex items-center justify-between h-10 px-2 border-b border-border-subtle bg-panel shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface transition-colors duration-[var(--transition-fast)]"
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <PanelLeft size={16} />
          </button>

          {selectedAgent && (
            <div className="flex items-center gap-2 ml-1">
              <Bot size={15} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">
                {selectedAgent.name}
              </span>
              <span className={`text-xs ${statusColorMap[selectedAgent.status]}`}>
                {statusLabelMap[selectedAgent.status]}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <TabBar />
          <button
            onClick={toggleRightPanel}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-secondary hover:bg-surface transition-colors duration-[var(--transition-fast)] ml-2"
            title="Toggle detail panel"
          >
            <PanelRight size={16} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <ActiveContent />
      </div>
    </div>
  );
}
