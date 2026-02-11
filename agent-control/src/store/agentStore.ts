import { create } from 'zustand';
import type { Agent, Activity, AgentStatus, AgentStore } from '../types';
import { 
  createInitialAgents, 
  createInitialActivities, 
  generateRandomActivity,
  generateRandomStatusChange,
  formatTimeAgo,
  dispatchTaskToAgent,
} from '../services/mockAgentService';

// Generate unique ID
const generateId = (): string => Math.random().toString(36).substring(2, 15);

// Simulation interval reference
let simulationInterval: ReturnType<typeof setInterval> | null = null;

export const useAgentStore = create<AgentStore>((set, get) => ({
  // Initial state
  agents: createInitialAgents(),
  activities: createInitialActivities(),
  selectedAgentId: 'agent-1',
  isSimulationRunning: false,

  // Actions
  setSelectedAgent: (agentId: string | null) => {
    set({ selectedAgentId: agentId });
  },

  updateAgentStatus: (agentId: string, status: AgentStatus) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? { 
              ...agent, 
              status, 
              lastActivity: 'just now',
              currentTask: status === 'running' ? agent.currentTask : undefined,
            }
          : agent
      ),
    }));

    // Add activity for status change
    const agent = get().agents.find(a => a.id === agentId);
    if (agent) {
      get().addActivity({
        agentId,
        message: `Agent status changed to ${status}`,
        timestamp: new Date(),
        type: status === 'error' ? 'error' : 'info',
      });
    }
  },

  addActivity: (activity: Omit<Activity, 'id'>) => {
    const newActivity: Activity = {
      ...activity,
      id: generateId(),
    };

    set((state) => ({
      activities: [newActivity, ...state.activities].slice(0, 100), // Keep last 100
      agents: state.agents.map((agent) =>
        agent.id === activity.agentId
          ? { ...agent, lastActivity: formatTimeAgo(activity.timestamp) }
          : agent
      ),
    }));
  },

  clearActivities: () => {
    set({ activities: [] });
  },

  updateAgent: (agentId: string, updates: Partial<Agent>) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? { ...agent, ...updates }
          : agent
      ),
    }));
  },

  startSimulation: () => {
    if (simulationInterval) return;

    set({ isSimulationRunning: true });

    simulationInterval = setInterval(() => {
      const state = get();
      const runningAgents = state.agents.filter(a => a.status === 'running');

      // Generate activity for a random running agent
      if (runningAgents.length > 0) {
        const randomAgent = runningAgents[Math.floor(Math.random() * runningAgents.length)];
        const activity = generateRandomActivity(randomAgent.id);
        state.addActivity(activity);

        // Update agent stats
        if (activity.type === 'success') {
          state.updateAgent(randomAgent.id, {
            tasksCompleted: randomAgent.tasksCompleted + 1,
            tokenUsage: randomAgent.tokenUsage + Math.floor(Math.random() * 200) + 50,
          });
        }
      }

      // Occasionally change agent status
      const agents = get().agents;
      agents.forEach((agent) => {
        const newStatus = generateRandomStatusChange(agent.status);
        if (newStatus) {
          state.updateAgentStatus(agent.id, newStatus);
        }
      });

      // Update runtime for running agents
      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.status === 'running'
            ? { ...agent, runtime: agent.runtime + 5 }
            : agent
        ),
      }));
    }, 5000); // Run every 5 seconds
  },

  stopSimulation: () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
    set({ isSimulationRunning: false });
  },

  dispatchTask: async (agentId: string, instruction: string) => {
    const agent = get().agents.find(a => a.id === agentId);
    if (!agent) return;

    // Update agent to running with new task
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === agentId
          ? { 
              ...a, 
              status: 'running' as AgentStatus, 
              currentTask: instruction.substring(0, 50) + (instruction.length > 50 ? '...' : ''),
              lastActivity: 'just now',
            }
          : a
      ),
    }));

    // Add activity
    const taskActivity = await dispatchTaskToAgent(agentId, instruction);
    set((state) => ({
      activities: [taskActivity, ...state.activities].slice(0, 100),
    }));
  },
}));

// Selector hooks for optimized re-renders
export const useSelectedAgent = () => useAgentStore((state) => {
  return state.agents.find(a => a.id === state.selectedAgentId) || null;
});

export const useAgentActivities = (agentId: string | null) => useAgentStore((state) => {
  if (!agentId) return state.activities;
  return state.activities.filter(a => a.agentId === agentId);
});
