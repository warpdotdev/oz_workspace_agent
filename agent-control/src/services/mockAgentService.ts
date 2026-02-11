import type { Agent, Activity, PerformanceMetric, AgentStatus, ActivityType } from '../types';

// Helper to generate unique IDs
const generateId = (): string => Math.random().toString(36).substring(2, 15);

// Format time ago string
export const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) > 1 ? 's' : ''} ago`;
  return `${Math.floor(seconds / 86400)} day${Math.floor(seconds / 86400) > 1 ? 's' : ''} ago`;
};

// Format uptime from seconds
export const formatUptime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Initial mock agents
export const createInitialAgents = (): Agent[] => [
  {
    id: 'agent-1',
    name: 'Data Processor',
    status: 'running',
    lastActivity: '2 min ago',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    currentTask: 'Processing batch 47/100',
    runtime: 4 * 60 * 60 + 23 * 60, // 4h 23m
    tokenUsage: 15420,
    tasksCompleted: 47,
    successRate: 98,
  },
  {
    id: 'agent-2',
    name: 'Report Generator',
    status: 'idle',
    lastActivity: '15 min ago',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    runtime: 2 * 60 * 60, // 2 hours
    tokenUsage: 8750,
    tasksCompleted: 23,
    successRate: 95,
  },
  {
    id: 'agent-3',
    name: 'API Monitor',
    status: 'paused',
    lastActivity: '1 hour ago',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
    runtime: 12 * 60 * 60, // 12 hours
    tokenUsage: 34200,
    tasksCompleted: 156,
    successRate: 99,
  },
  {
    id: 'agent-4',
    name: 'Code Reviewer',
    status: 'running',
    lastActivity: 'just now',
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    currentTask: 'Reviewing PR #142',
    runtime: 30 * 60, // 30 min
    tokenUsage: 5240,
    tasksCompleted: 3,
    successRate: 100,
  },
];

// Initial mock activities
export const createInitialActivities = (): Activity[] => [
  {
    id: generateId(),
    agentId: 'agent-1',
    message: 'Processing batch 47/100',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    type: 'info',
  },
  {
    id: generateId(),
    agentId: 'agent-1',
    message: 'Successfully completed batch 46',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    type: 'success',
  },
  {
    id: generateId(),
    agentId: 'agent-4',
    message: 'Started reviewing PR #142',
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
    type: 'task',
  },
  {
    id: generateId(),
    agentId: 'agent-4',
    message: 'Analyzing code patterns...',
    timestamp: new Date(Date.now() - 30 * 1000),
    type: 'thought',
    details: 'Checking for code smells and potential improvements',
  },
  {
    id: generateId(),
    agentId: 'agent-2',
    message: 'Waiting for input data',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    type: 'warning',
  },
  {
    id: generateId(),
    agentId: 'agent-3',
    message: 'Agent paused by user',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    type: 'info',
  },
];

// Generate mock performance metrics for charts
export const generatePerformanceMetrics = (count: number = 20): PerformanceMetric[] => {
  const metrics: PerformanceMetric[] = [];
  const now = Date.now();
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * 5 * 60 * 1000); // 5 min intervals
    metrics.push({
      timestamp,
      tasksCompleted: Math.floor(Math.random() * 5) + 1,
      successRate: Math.floor(Math.random() * 10) + 90, // 90-100%
      tokenUsage: Math.floor(Math.random() * 500) + 200,
      responseTime: Math.floor(Math.random() * 500) + 100, // 100-600ms
    });
  }
  
  return metrics;
};

// Simulation message templates
const activityMessages: Record<ActivityType, string[]> = {
  info: [
    'Processing data chunk {n}...',
    'Fetching resources from API',
    'Validating input parameters',
    'Initializing task context',
    'Scanning file structure',
  ],
  success: [
    'Task completed successfully',
    'Data processed and stored',
    'Report generated',
    'Code review approved',
    'Deployment successful',
  ],
  error: [
    'Connection timeout - retrying',
    'Invalid response format',
    'Rate limit exceeded',
    'Authentication failed',
    'Resource not found',
  ],
  warning: [
    'High memory usage detected',
    'Slow response time observed',
    'Approaching rate limit',
    'Token usage above threshold',
    'Retry attempt {n}/3',
  ],
  thought: [
    'Analyzing patterns in data...',
    'Considering alternative approaches',
    'Evaluating trade-offs',
    'Planning next steps',
    'Reviewing previous results',
  ],
  task: [
    'Started new task: {task}',
    'Continuing batch processing',
    'Resuming paused work',
    'Beginning code analysis',
    'Initiating data migration',
  ],
};

// Generate a random activity for an agent
export const generateRandomActivity = (agentId: string): Omit<Activity, 'id'> => {
  const types: ActivityType[] = ['info', 'success', 'warning', 'thought', 'task'];
  const weights = [0.4, 0.25, 0.1, 0.15, 0.1]; // Weighted probability
  
  let random = Math.random();
  let typeIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      typeIndex = i;
      break;
    }
  }
  
  const type = types[typeIndex];
  const messages = activityMessages[type];
  let message = messages[Math.floor(Math.random() * messages.length)];
  
  // Replace placeholders
  message = message.replace('{n}', String(Math.floor(Math.random() * 100) + 1));
  message = message.replace('{task}', ['PR review', 'data sync', 'report generation', 'code analysis'][Math.floor(Math.random() * 4)]);
  
  return {
    agentId,
    message,
    timestamp: new Date(),
    type,
    details: type === 'thought' ? 'Internal reasoning process' : undefined,
  };
};

// Generate a random status change
export const generateRandomStatusChange = (currentStatus: AgentStatus): AgentStatus | null => {
  const random = Math.random();
  
  // 80% chance to stay the same
  if (random > 0.2) return null;
  
  const transitions: Record<AgentStatus, AgentStatus[]> = {
    running: ['paused', 'idle', 'error'],
    idle: ['running', 'paused'],
    paused: ['running', 'idle'],
    error: ['idle', 'running'],
  };
  
  const possibleNextStates = transitions[currentStatus];
  return possibleNextStates[Math.floor(Math.random() * possibleNextStates.length)];
};

// Simulate API delay
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock API call to fetch agents
export const fetchAgents = async (): Promise<Agent[]> => {
  await delay(100); // Simulate network latency
  return createInitialAgents();
};

// Mock API call to fetch activities
export const fetchActivities = async (): Promise<Activity[]> => {
  await delay(50);
  return createInitialActivities();
};

// Mock API call to dispatch a task
export const dispatchTaskToAgent = async (agentId: string, instruction: string): Promise<Activity> => {
  await delay(200);
  return {
    id: generateId(),
    agentId,
    message: `Task dispatched: ${instruction.substring(0, 50)}${instruction.length > 50 ? '...' : ''}`,
    timestamp: new Date(),
    type: 'task',
    details: instruction,
  };
};

// Mock API call to update agent status
export const updateAgentStatusAPI = async (_agentId: string, _status: AgentStatus): Promise<Agent | null> => {
  await delay(100);
  // In a real app, this would update the backend
  return null; // Let the store handle the state update
};
