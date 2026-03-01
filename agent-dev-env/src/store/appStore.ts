import { create } from "zustand";
import type { AppState, Agent } from "../types";

const mockAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Code Reviewer",
    status: "running",
    description: "Automated code review agent for PRs",
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-02-28T18:00:00Z",
  },
  {
    id: "agent-2",
    name: "Issue Triager",
    status: "paused",
    description: "Triages incoming GitHub issues",
    createdAt: "2026-02-22T14:00:00Z",
    updatedAt: "2026-02-27T12:00:00Z",
  },
  {
    id: "agent-3",
    name: "Deploy Monitor",
    status: "errored",
    description: "Monitors deployment health and alerts",
    createdAt: "2026-02-25T09:00:00Z",
    updatedAt: "2026-02-28T20:00:00Z",
  },
  {
    id: "agent-4",
    name: "Feedback Collector",
    status: "deploying",
    description: "Collects and summarizes user feedback daily",
    createdAt: "2026-02-26T16:00:00Z",
    updatedAt: "2026-02-28T22:00:00Z",
  },
];

export const useAppStore = create<AppState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Right panel
  rightPanelOpen: false,
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

  // Agent selection
  selectedAgentId: "agent-1",
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),

  // Active tab
  activeTab: "editor",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Agents
  agents: mockAgents,

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Editor state
  selectedFileId: null,
  setSelectedFileId: (id) => set({ selectedFileId: id }),
  editorContent: "",
  setEditorContent: (content) => set({ editorContent: content }),
  previewMode: false,
  setPreviewMode: (mode) => set({ previewMode: mode }),
}));
