import { create } from "zustand";
import { Agent, Activity, Task, AppNotification, AgentMetrics } from "@/types";

interface AgentStore {
  // State
  agents: Agent[];
  selectedAgentId: string | null;
  activities: Activity[];
  tasks: Task[];
  notifications: AppNotification[];
  metrics: Record<string, AgentMetrics[]>;
  isCommandBarOpen: boolean;

  // Agent actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  selectAgent: (id: string | null) => void;

  // Activity actions
  addActivity: (activity: Activity) => void;
  clearActivities: (agentId?: string) => void;

  // Task actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;

  // Notification actions
  addNotification: (notification: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Metrics actions
  addMetrics: (agentId: string, metrics: AgentMetrics) => void;

  // UI actions
  setCommandBarOpen: (open: boolean) => void;
  toggleCommandBar: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  // Initial state
  agents: [],
  selectedAgentId: null,
  activities: [],
  tasks: [],
  notifications: [],
  metrics: {},
  isCommandBarOpen: false,

  // Agent actions
  setAgents: (agents) => set({ agents }),

  addAgent: (agent) =>
    set((state) => ({
      agents: [...state.agents, agent],
    })),

  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...updates } : agent
      ),
    })),

  removeAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((agent) => agent.id !== id),
      selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
    })),

  selectAgent: (id) => set({ selectedAgentId: id }),

  // Activity actions
  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities].slice(0, 500), // Keep last 500 activities
    })),

  clearActivities: (agentId) =>
    set((state) => ({
      activities: agentId
        ? state.activities.filter((a) => a.agentId !== agentId)
        : [],
    })),

  // Task actions
  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    })),

  // Notification actions
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 100),
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  clearNotifications: () => set({ notifications: [] }),

  // Metrics actions
  addMetrics: (agentId, metrics) =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        [agentId]: [...(state.metrics[agentId] || []), metrics].slice(-100), // Keep last 100 data points
      },
    })),

  // UI actions
  setCommandBarOpen: (open) => set({ isCommandBarOpen: open }),
  toggleCommandBar: () =>
    set((state) => ({ isCommandBarOpen: !state.isCommandBarOpen })),
}));
