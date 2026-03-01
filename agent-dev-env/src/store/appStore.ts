import { create } from "zustand";
import type { AppState, Agent, FileTreeNode } from "../types";

const mockAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Code Reviewer",
    status: "running",
    description: "Automated code review agent for PRs",
    template: "code-assistant",
    createdAt: "2026-02-20T10:00:00Z",
    updatedAt: "2026-02-28T18:00:00Z",
  },
  {
    id: "agent-2",
    name: "Issue Triager",
    status: "paused",
    description: "Triages incoming GitHub issues",
    template: "blank",
    createdAt: "2026-02-22T14:00:00Z",
    updatedAt: "2026-02-27T12:00:00Z",
  },
  {
    id: "agent-3",
    name: "Deploy Monitor",
    status: "errored",
    description: "Monitors deployment health and alerts",
    template: "web-scraper",
    createdAt: "2026-02-25T09:00:00Z",
    updatedAt: "2026-02-28T20:00:00Z",
  },
  {
    id: "agent-4",
    name: "Feedback Collector",
    status: "deploying",
    description: "Collects and summarizes user feedback daily",
    template: "web-scraper",
    createdAt: "2026-02-26T16:00:00Z",
    updatedAt: "2026-02-28T22:00:00Z",
  },
];

/** Generate default file tree for a new agent */
export function createDefaultFileTree(agentId: string): FileTreeNode[] {
  return [
    {
      id: `${agentId}-markdown`,
      name: "markdown",
      isFolder: true,
      fileType: "markdown",
      children: [
        {
          id: `${agentId}-markdown-readme`,
          name: "README.md",
          isFolder: false,
          fileType: "markdown",
        },
      ],
    },
    {
      id: `${agentId}-memory`,
      name: "memory",
      isFolder: true,
      fileType: "memory",
      children: [],
    },
    {
      id: `${agentId}-skills`,
      name: "skills",
      isFolder: true,
      fileType: "skill",
      children: [],
    },
  ];
}

// Pre-populate file trees for mock agents
const initialFileTreeByAgent: Record<string, FileTreeNode[]> = {};
for (const agent of mockAgents) {
  initialFileTreeByAgent[agent.id] = createDefaultFileTree(agent.id);
}

// Add extra files to agent-1 so it looks more realistic
initialFileTreeByAgent["agent-1"] = [
  {
    id: "agent-1-markdown",
    name: "markdown",
    isFolder: true,
    fileType: "markdown",
    children: [
      {
        id: "agent-1-markdown-readme",
        name: "README.md",
        isFolder: false,
        fileType: "markdown",
      },
      {
        id: "agent-1-markdown-instructions",
        name: "instructions.md",
        isFolder: false,
        fileType: "markdown",
      },
      {
        id: "agent-1-markdown-prompts",
        name: "prompts.md",
        isFolder: false,
        fileType: "markdown",
      },
    ],
  },
  {
    id: "agent-1-memory",
    name: "memory",
    isFolder: true,
    fileType: "memory",
    children: [
      {
        id: "agent-1-memory-context",
        name: "context.md",
        isFolder: false,
        fileType: "memory",
      },
    ],
  },
  {
    id: "agent-1-skills",
    name: "skills",
    isFolder: true,
    fileType: "skill",
    children: [
      {
        id: "agent-1-skills-review",
        name: "review-code.md",
        isFolder: false,
        fileType: "skill",
      },
      {
        id: "agent-1-skills-summarize",
        name: "summarize-pr.md",
        isFolder: false,
        fileType: "skill",
      },
    ],
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Right panel
  rightPanelOpen: false,
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

  // Agent selection
  selectedAgentId: "agent-1",
  setSelectedAgentId: (id) => {
    const state = get();
    const tab =
      id && state.activeTabByAgent[id]
        ? state.activeTabByAgent[id]
        : "editor";
    set({
      selectedAgentId: id,
      activeTab: tab,
      selectedFileId: null,
    });
  },

  // Per-agent active tab
  activeTabByAgent: {},
  activeTab: "editor",
  setActiveTab: (tab) => {
    const { selectedAgentId } = get();
    set((state) => ({
      activeTab: tab,
      activeTabByAgent: selectedAgentId
        ? { ...state.activeTabByAgent, [selectedAgentId]: tab }
        : state.activeTabByAgent,
    }));
  },

  // Agents
  agents: mockAgents,
  addAgent: (agent) =>
    set((state) => ({
      agents: [...state.agents, agent],
      fileTreeByAgent: {
        ...state.fileTreeByAgent,
        [agent.id]: createDefaultFileTree(agent.id),
      },
    })),
  removeAgent: (id) =>
    set((state) => {
      const { [id]: _removed, ...restTrees } = state.fileTreeByAgent;
      const { [id]: _removedTab, ...restTabs } = state.activeTabByAgent;
      return {
        agents: state.agents.filter((a) => a.id !== id),
        fileTreeByAgent: restTrees,
        activeTabByAgent: restTabs,
        selectedAgentId:
          state.selectedAgentId === id ? null : state.selectedAgentId,
      };
    }),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  // File tree per agent
  fileTreeByAgent: initialFileTreeByAgent,
  setFileTree: (agentId, tree) =>
    set((state) => ({
      fileTreeByAgent: { ...state.fileTreeByAgent, [agentId]: tree },
    })),

  // Selected file
  selectedFileId: null,
  setSelectedFileId: (id) => set({ selectedFileId: id }),

  // Command palette
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Create agent modal
  createAgentModalOpen: false,
  setCreateAgentModalOpen: (open) => set({ createAgentModalOpen: open }),

  // Editor state
  editorContent: "",
  setEditorContent: (content) => set({ editorContent: content }),
  previewMode: false,
  setPreviewMode: (mode) => set({ previewMode: mode }),
}));
