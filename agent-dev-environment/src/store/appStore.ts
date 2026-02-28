import { create } from "zustand";
import type { Agent, TabId, Workspace } from "../types";

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Right panel
  rightPanelOpen: boolean;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;

  // Workspace
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;

  // Agent selection
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;

  // Active tab per agent
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Agents list
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

// Sample data for initial state
const sampleAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Code Reviewer",
    status: "running",
    description: "Automated code review agent for PRs",
    lastActive: "2 min ago",
  },
  {
    id: "agent-2",
    name: "Issue Triager",
    status: "paused",
    description: "Triages incoming GitHub issues",
    lastActive: "1 hour ago",
  },
  {
    id: "agent-3",
    name: "Deployment Bot",
    status: "deploying",
    description: "Manages staging deployments",
    lastActive: "5 min ago",
  },
  {
    id: "agent-4",
    name: "Security Scanner",
    status: "errored",
    description: "Scans repos for vulnerabilities",
    lastActive: "30 min ago",
  },
  {
    id: "agent-5",
    name: "Doc Generator",
    status: "stopped",
    description: "Generates API documentation",
    lastActive: "3 hours ago",
  },
];

const defaultWorkspace: Workspace = {
  id: "ws-1",
  name: "My Workspace",
  agentCount: sampleAgents.length,
};

export const useAppStore = create<AppState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Right panel
  rightPanelOpen: false,
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

  // Workspace
  activeWorkspace: defaultWorkspace,
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),

  // Agent
  selectedAgent: sampleAgents[0],
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  // Tab
  activeTab: "editor",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Agents
  agents: sampleAgents,
  setAgents: (agents) => set({ agents }),

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
