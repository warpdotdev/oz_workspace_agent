export type AgentStatus = "running" | "errored" | "deploying" | "paused" | "stopped";

export type TabId = "editor" | "schedule" | "identity" | "environments" | "observe";

export type AgentTemplate = "blank" | "web-scraper" | "code-assistant";

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  description?: string;
  template?: AgentTemplate;
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

/** Tree node used by react-arborist */
export interface FileTreeNode {
  id: string;
  name: string;
  isFolder: boolean;
  children?: FileTreeNode[];
  fileType?: "markdown" | "memory" | "skill" | "config";
  /** Database file ID (for persisted files) */
  dbId?: string;
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

  // Per-agent active tab
  activeTabByAgent: Record<string, TabId>;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Agents list
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;

  // File tree per agent
  fileTreeByAgent: Record<string, FileTreeNode[]>;
  setFileTree: (agentId: string, tree: FileTreeNode[]) => void;

  // Selected file
  selectedFileId: string | null;
  setSelectedFileId: (id: string | null) => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Create agent modal
  createAgentModalOpen: boolean;
  setCreateAgentModalOpen: (open: boolean) => void;

  // Editor state
  editorContent: string;
  setEditorContent: (content: string) => void;
  previewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
}
