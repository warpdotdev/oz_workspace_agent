// Agent status types
export type AgentStatus = 'running' | 'error' | 'idle' | 'paused';

// Activity types
export type ActivityType = 'info' | 'success' | 'error' | 'warning' | 'thought' | 'task';

// Agent model
export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  lastActivity: string;
  createdAt: Date;
  currentTask?: string;
  runtime: number; // in seconds
  tokenUsage: number;
  tasksCompleted: number;
  successRate: number;
}

// Activity/log entry model
export interface Activity {
  id: string;
  agentId: string;
  message: string;
  timestamp: Date;
  type: ActivityType;
  details?: string;
}

// Performance metrics for charts
export interface PerformanceMetric {
  timestamp: Date;
  tasksCompleted: number;
  successRate: number;
  tokenUsage: number;
  responseTime: number; // in ms
}

// Agent with performance history
export interface AgentWithMetrics extends Agent {
  metrics: PerformanceMetric[];
}

// Task model for dispatching
export interface Task {
  id: string;
  agentId: string;
  instruction: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

// Stats summary for dashboard
export interface AgentStats {
  totalTasksCompleted: number;
  uptime: string;
  successRate: number;
  avgResponseTime: number;
  totalTokenUsage: number;
}

// Store state shape
export interface AgentStoreState {
  agents: Agent[];
  activities: Activity[];
  selectedAgentId: string | null;
  isSimulationRunning: boolean;
}

// Store actions
export interface AgentStoreActions {
  setSelectedAgent: (agentId: string | null) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  clearActivities: () => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  dispatchTask: (agentId: string, instruction: string) => void;
}

export type AgentStore = AgentStoreState & AgentStoreActions;
