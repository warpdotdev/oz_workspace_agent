import { create } from 'zustand';
import { Agent, Activity } from '../types';

interface AppState {
  agents: Agent[];
  activities: Activity[];
  selectedAgentId: string | null;
  
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  
  setActivities: (activities: Activity[]) => void;
  addActivity: (activity: Activity) => void;
  
  setSelectedAgent: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  agents: [],
  activities: [],
  selectedAgentId: null,
  
  setAgents: (agents) => set({ agents }),
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
  updateAgent: (id, updates) => set((state) => ({
    agents: state.agents.map((agent) =>
      agent.id === id ? { ...agent, ...updates } : agent
    ),
  })),
  
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities],
  })),
  
  setSelectedAgent: (selectedAgentId) => set({ selectedAgentId }),
}));
