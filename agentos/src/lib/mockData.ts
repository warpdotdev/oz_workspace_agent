import type { Agent, ActivityEvent, AgentStatus, AgentConfig } from '../types';

const defaultConfig: AgentConfig = {
  model: 'gpt-4',
  maxTokens: 4096,
  temperature: 0.7,
  systemPrompt: 'You are a helpful AI assistant.',
  tools: ['web_search', 'code_execution', 'file_access'],
};

// Generate mock agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Code Review Bot',
    status: 'running',
    currentTask: 'Reviewing PR #142',
    framework: 'langchain',
    startedAt: new Date(Date.now() - 3600000),
    tokensUsed: 57000,
    estimatedCost: 0.85,
    lastHeartbeat: new Date(),
    config: { ...defaultConfig, model: 'claude-3-sonnet' },
  },
  {
    id: 'agent-2',
    name: 'Documentation Writer',
    status: 'idle',
    currentTask: null,
    framework: 'openai',
    startedAt: new Date(Date.now() - 86400000),
    tokensUsed: 205000,
    estimatedCost: 3.25,
    lastHeartbeat: new Date(Date.now() - 1800000),
    config: { ...defaultConfig, model: 'gpt-4-turbo' },
  },
  {
    id: 'agent-3',
    name: 'Test Generator',
    status: 'paused',
    currentTask: 'Generating unit tests for auth module',
    framework: 'crewai',
    startedAt: new Date(Date.now() - 7200000),
    tokensUsed: 43000,
    estimatedCost: 0.65,
    lastHeartbeat: new Date(Date.now() - 900000),
    config: { ...defaultConfig, model: 'claude-3-opus' },
  },
  {
    id: 'agent-4',
    name: 'Bug Fixer',
    status: 'error',
    currentTask: 'Failed: Could not parse file',
    framework: 'custom',
    startedAt: new Date(Date.now() - 600000),
    tokensUsed: 10000,
    estimatedCost: 0.15,
    lastHeartbeat: new Date(Date.now() - 300000),
    config: { ...defaultConfig, model: 'claude-3-haiku' },
  },
];

// Generate mock activities
export const mockActivities: ActivityEvent[] = [
  {
    id: 'activity-1',
    agentId: 'agent-1',
    agentName: 'Code Review Bot',
    type: 'thought',
    message: 'Analyzing code changes in src/components/Button.tsx',
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: 'activity-2',
    agentId: 'agent-4',
    agentName: 'Bug Fixer',
    type: 'error',
    message: 'Failed to parse file: Unexpected token at line 42',
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: 'activity-3',
    agentId: 'agent-2',
    agentName: 'Documentation Writer',
    type: 'task_completed',
    message: 'Completed documentation for API endpoints',
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: 'activity-4',
    agentId: 'agent-3',
    agentName: 'Test Generator',
    type: 'status_change',
    message: 'Agent paused by user',
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: 'activity-5',
    agentId: 'agent-1',
    agentName: 'Code Review Bot',
    type: 'task_started',
    message: 'Started reviewing PR #142: Add user authentication',
    timestamp: new Date(Date.now() - 240000),
  },
];

// Simulate generating new activities
const thoughts = [
  'Analyzing code structure...',
  'Checking for potential issues...',
  'Reviewing best practices compliance...',
  'Generating suggestions...',
  'Processing file changes...',
  'Evaluating test coverage...',
  'Scanning for security vulnerabilities...',
];

export function generateRandomActivity(agents: Agent[]): ActivityEvent | null {
  const runningAgents = agents.filter((a) => a.status === 'running');
  if (runningAgents.length === 0) return null;

  const agent = runningAgents[Math.floor(Math.random() * runningAgents.length)];
  const thought = thoughts[Math.floor(Math.random() * thoughts.length)];

  return {
    id: `activity-${Date.now()}`,
    agentId: agent.id,
    agentName: agent.name,
    type: 'thought',
    message: thought,
    timestamp: new Date(),
  };
}

// Simulate status changes
export function generateRandomStatusChange(agent: Agent): AgentStatus {
  const currentStatus = agent.status;
  const transitions: Record<AgentStatus, AgentStatus[]> = {
    running: ['running', 'running', 'running', 'paused', 'idle'],
    paused: ['running', 'paused'],
    idle: ['running', 'idle'],
    error: ['idle', 'error'],
    pending: ['running', 'pending'],
  };

  const possibleStates = transitions[currentStatus];
  return possibleStates[Math.floor(Math.random() * possibleStates.length)];
}
