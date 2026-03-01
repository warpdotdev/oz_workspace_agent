export type AgentStatus = "running" | "errored" | "deploying" | "paused" | "stopped";

export type TabId = "editor" | "schedule" | "identity" | "environments" | "observe";

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  agentId: string;
}

export interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Right panel
  rightPanelOpen: boolean;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;

  // Agent selection
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;

  // Active tab
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Agents list (mock data for now)
  agents: Agent[];

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Editor state
  selectedFileId: string | null;
  setSelectedFileId: (id: string | null) => void;
  editorContent: string;
  setEditorContent: (content: string) => void;
  previewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
}
