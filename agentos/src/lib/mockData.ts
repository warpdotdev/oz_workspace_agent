import type { Agent, ActivityEvent, AgentStatus } from '../types';

// Generate mock agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    config: {
      id: 'agent-1',
      name: 'Code Review Bot',
      description: 'AI agent for code review tasks',
      framework: 'langchain',
      model: 'claude-3-sonnet',
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt: 'You are a code review assistant.',
      tools: ['code_execution', 'file_access'],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    status: 'running',
    currentTask: 'Reviewing PR #142',
    runtime: 3600000, // 1 hour
    tokensUsed: 57000,
    lastActivity: new Date().toISOString(),
    errorMessage: null,
  },
  {
    id: 'agent-2',
    config: {
      id: 'agent-2',
      name: 'Documentation Writer',
      description: 'AI agent for documentation tasks',
      framework: 'openai',
      model: 'gpt-4-turbo',
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt: 'You are a documentation writer.',
      tools: ['web_search', 'file_access'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
    },
    status: 'idle',
    currentTask: null,
    runtime: 7200000, // 2 hours
    tokensUsed: 205000,
    lastActivity: new Date(Date.now() - 1800000).toISOString(),
    errorMessage: null,
  },
  {
    id: 'agent-3',
    config: {
      id: 'agent-3',
      name: 'Test Generator',
      description: 'AI agent for test generation',
      framework: 'crewai',
      model: 'claude-3-opus',
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt: 'You are a test generation assistant.',
      tools: ['code_execution'],
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 900000).toISOString(),
    },
    status: 'paused',
    currentTask: 'Generating unit tests for auth module',
    runtime: 1800000, // 30 minutes
    tokensUsed: 43000,
    lastActivity: new Date(Date.now() - 900000).toISOString(),
    errorMessage: null,
  },
  {
    id: 'agent-4',
    config: {
      id: 'agent-4',
      name: 'Bug Fixer',
      description: 'AI agent for bug fixing',
      framework: 'custom',
      model: 'claude-3-haiku',
      maxTokens: 2048,
      temperature: 0.5,
      systemPrompt: 'You are a bug fixing assistant.',
      tools: ['code_execution', 'file_access'],
      createdAt: new Date(Date.now() - 600000).toISOString(),
      updatedAt: new Date(Date.now() - 300000).toISOString(),
    },
    status: 'error',
    currentTask: 'Failed: Could not parse file',
    runtime: 600000, // 10 minutes
    tokensUsed: 10000,
    lastActivity: new Date(Date.now() - 300000).toISOString(),
    errorMessage: 'Failed to parse file: Unexpected token at line 42',
  },
];

// Generate mock activities
export const mockActivities: ActivityEvent[] = [
  {
    id: 'activity-1',
    agentId: 'agent-1',
    agentName: 'Code Review Bot',
    eventType: 'thought',
    type: 'thought',
    message: 'Analyzing code changes in src/components/Button.tsx',
    content: 'Analyzing code changes in src/components/Button.tsx',
    timestamp: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: 'activity-2',
    agentId: 'agent-4',
    agentName: 'Bug Fixer',
    eventType: 'error',
    type: 'error',
    message: 'Failed to parse file: Unexpected token at line 42',
    content: 'Failed to parse file: Unexpected token at line 42',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: 'activity-3',
    agentId: 'agent-2',
    agentName: 'Documentation Writer',
    eventType: 'task_complete',
    type: 'task_complete',
    message: 'Completed documentation for API endpoints',
    content: 'Completed documentation for API endpoints',
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 'activity-4',
    agentId: 'agent-3',
    agentName: 'Test Generator',
    eventType: 'status_change',
    type: 'status_change',
    message: 'Agent paused by user',
    content: 'Agent paused by user',
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
  {
    id: 'activity-5',
    agentId: 'agent-1',
    agentName: 'Code Review Bot',
    eventType: 'action',
    type: 'action',
    message: 'Started reviewing PR #142: Add user authentication',
    content: 'Started reviewing PR #142: Add user authentication',
    timestamp: new Date(Date.now() - 240000).toISOString(),
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
    agentName: agent.config.name,
    eventType: 'thought',
    type: 'thought',
    message: thought,
    content: thought,
    timestamp: new Date().toISOString(),
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
