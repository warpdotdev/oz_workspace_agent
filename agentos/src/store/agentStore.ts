import { create } from 'zustand';
import type { Agent, ActivityEvent } from '../types';

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  activities: ActivityEvent[];
  isCommandBarOpen: boolean;
  
  // Actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  selectAgent: (id: string | null) => void;
  
  addActivity: (activity: ActivityEvent) => void;
  clearActivities: () => void;
  
  setCommandBarOpen: (open: boolean) => void;
  toggleCommandBar: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  selectedAgentId: null,
  activities: [],
  isCommandBarOpen: false,
  
  setAgents: (agents) => set({ agents }),
  
  addAgent: (agent) => set((state) => ({ 
    agents: [...state.agents, agent] 
  })),
  
  updateAgent: (id, updates) => set((state) => ({
    agents: state.agents.map((agent) =>
      agent.id === id ? { ...agent, ...updates } : agent
    ),
  })),
  
  removeAgent: (id) => set((state) => ({
    agents: state.agents.filter((agent) => agent.id !== id),
    selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
  })),
  
  selectAgent: (id) => set({ selectedAgentId: id }),
  
  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities].slice(0, 100), // Keep last 100 activities
  })),
  
  clearActivities: () => set({ activities: [] }),
  
  setCommandBarOpen: (open) => set({ isCommandBarOpen: open }),
  
  toggleCommandBar: () => set((state) => ({ 
    isCommandBarOpen: !state.isCommandBarOpen 
  })),
}));
