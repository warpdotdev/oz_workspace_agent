import {
  FileEdit,
  Clock,
  Shield,
  Server,
  Activity,
  PanelRight,
} from "lucide-react";
import { useAppStore } from "../store/appStore";
import { StatusBadge } from "./StatusBadge";
import type { TabId } from "../types";

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "editor", label: "Editor", icon: <FileEdit size={14} /> },
  { id: "schedule", label: "Schedule", icon: <Clock size={14} /> },
  { id: "identity", label: "Identity", icon: <Shield size={14} /> },
  { id: "environments", label: "Environments", icon: <Server size={14} /> },
  { id: "observe", label: "Observe", icon: <Activity size={14} /> },
];

function EditorPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full text-text-tertiary">
      <div className="text-center space-y-3">
        <FileEdit size={48} className="mx-auto opacity-30" />
        <p className="text-lg font-medium text-text-secondary">Markdown Editor</p>
        <p className="text-sm">Select a file to start editing</p>
        <p className="text-2xs text-text-disabled">CodeMirror 6 · Block-based editing · Slash commands</p>
      </div>
    </div>
  );
}

function SchedulePlaceholder() {
  return (
    <div className="flex items-center justify-center h-full text-text-tertiary">
      <div className="text-center space-y-3">
        <Clock size={48} className="mx-auto opacity-30" />
        <p className="text-lg font-medium text-text-secondary">Schedule Management</p>
        <p className="text-sm">Visual calendar · Cron expressions · Time zone support</p>
      </div>
    </div>
  );
}

function IdentityPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full text-text-tertiary">
      <div className="text-center space-y-3">
        <Shield size={48} className="mx-auto opacity-30" />
        <p className="text-lg font-medium text-text-secondary">Identity & Access</p>
        <p className="text-sm">API keys · Roles · Permissions · Audit log</p>
      </div>
    </div>
  );
}

function EnvironmentsPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full text-text-tertiary">
      <div className="text-center space-y-3">
        <Server size={48} className="mx-auto opacity-30" />
        <p className="text-lg font-medium text-text-secondary">Environments</p>
        <p className="text-sm">Dev · Staging · Production · Promote pipeline</p>
      </div>
    </div>
  );
}

function ObservePlaceholder() {
  return (
    <div className="flex items-center justify-center h-full text-text-tertiary">
      <div className="text-center space-y-3">
        <Activity size={48} className="mx-auto opacity-30" />
        <p className="text-lg font-medium text-text-secondary">Observability</p>
        <p className="text-sm">Logs · Metrics · Traces · Run history</p>
      </div>
    </div>
  );
}

const tabContent: Record<TabId, React.ReactNode> = {
  editor: <EditorPlaceholder />,
  schedule: <SchedulePlaceholder />,
  identity: <IdentityPlaceholder />,
  environments: <EnvironmentsPlaceholder />,
  observe: <ObservePlaceholder />,
};

export function MainContent() {
  const { selectedAgent, activeTab, setActiveTab, toggleRightPanel } = useAppStore();

  if (!selectedAgent) {
    return (
      <div className="flex items-center justify-center h-full bg-surface-base">
        <div className="text-center space-y-3">
          <p className="text-lg font-medium text-text-secondary">No Agent Selected</p>
          <p className="text-sm text-text-tertiary">
            Select an agent from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-base">
      {/* Agent Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-text-primary">{selectedAgent.name}</h1>
          <StatusBadge status={selectedAgent.status} showLabel />
        </div>
        <button
          onClick={toggleRightPanel}
          className="p-1.5 text-text-tertiary hover:text-text-primary rounded hover:bg-surface-elevated transition-colors"
          title="Toggle details panel"
        >
          <PanelRight size={16} />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center border-b border-border-subtle px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-state={activeTab === tab.id ? "active" : "inactive"}
            className="tab-trigger flex items-center gap-1.5"
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">{tabContent[activeTab]}</div>
    </div>
  );
}
