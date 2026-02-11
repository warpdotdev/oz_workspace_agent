import { create } from 'zustand';
import type { Agent, AgentEvent, Task } from '../types';

interface AgentStore {
  // State
  agents: Agent[];
  selectedAgentId: string | null;
  events: AgentEvent[];
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  selectAgent: (id: string | null) => void;
  
  addEvent: (event: AgentEvent) => void;
  clearEvents: () => void;
  
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  // Initial state
  agents: [],
  selectedAgentId: null,
  events: [],
  tasks: [],
  isLoading: false,
  error: null,

  // Agent actions
  setAgents: (agents) => set({ agents }),
  
  addAgent: (agent) =>
    set((state) => ({ agents: [...state.agents, agent] })),
  
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

  // Event actions
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100), // Keep last 100 events
    })),
  
  clearEvents: () => set({ events: [] }),

  // Task actions
  addTask: (task) =>
    set((state) => ({ tasks: [...state.tasks, task] })),
  
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    })),

  // Loading/error actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// Selector hooks for better performance
export const useSelectedAgent = () => {
  const agents = useAgentStore((state) => state.agents);
  const selectedId = useAgentStore((state) => state.selectedAgentId);
  return agents.find((agent) => agent.id === selectedId) ?? null;
};

export const useAgentById = (id: string) => {
  return useAgentStore((state) => state.agents.find((a) => a.id === id));
};

export const useAgentEvents = (agentId?: string) => {
  return useAgentStore((state) =>
    agentId ? state.events.filter((e) => e.agentId === agentId) : state.events
  );
};
