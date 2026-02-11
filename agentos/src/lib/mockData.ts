import type { Agent, ActivityEvent, AgentStatus } from '../types';

// Generate mock agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Code Review Bot',
    status: 'running',
    currentTask: 'Reviewing PR #142',
    runtime: 3600000, // 1 hour
    tokenUsage: { input: 45000, output: 12000 },
    model: 'claude-3-sonnet',
    createdAt: new Date(Date.now() - 3600000),
    lastActiveAt: new Date(),
  },
  {
    id: 'agent-2',
    name: 'Documentation Writer',
    status: 'idle',
    currentTask: undefined,
    runtime: 7200000, // 2 hours
    tokenUsage: { input: 120000, output: 85000 },
    model: 'gpt-4-turbo',
    createdAt: new Date(Date.now() - 86400000),
    lastActiveAt: new Date(Date.now() - 1800000),
  },
  {
    id: 'agent-3',
    name: 'Test Generator',
    status: 'paused',
    currentTask: 'Generating unit tests for auth module',
    runtime: 1800000, // 30 minutes
    tokenUsage: { input: 28000, output: 15000 },
    model: 'claude-3-opus',
    createdAt: new Date(Date.now() - 7200000),
    lastActiveAt: new Date(Date.now() - 900000),
  },
  {
    id: 'agent-4',
    name: 'Bug Fixer',
    status: 'error',
    currentTask: 'Failed: Could not parse file',
    runtime: 600000, // 10 minutes
    tokenUsage: { input: 8000, output: 2000 },
    model: 'claude-3-haiku',
    createdAt: new Date(Date.now() - 600000),
    lastActiveAt: new Date(Date.now() - 300000),
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
  };

  const possibleStates = transitions[currentStatus];
  return possibleStates[Math.floor(Math.random() * possibleStates.length)];
}
