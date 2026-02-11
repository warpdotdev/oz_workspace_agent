import { Agent, Activity, AgentStatus, ActivityType, AgentMetrics } from "@/types";

// Generate unique IDs
let idCounter = 0;
const generateId = () => `${Date.now()}-${++idCounter}`;

// Mock agent data
const mockAgentNames = [
  "Research Agent",
  "Code Writer",
  "Data Analyst",
  "Content Creator",
  "Task Coordinator",
];

const mockTasks = [
  "Analyzing market trends for Q1 2026",
  "Refactoring authentication module",
  "Processing customer feedback data",
  "Generating weekly status report",
  "Coordinating sprint deliverables",
  "Reviewing pull request changes",
  "Optimizing database queries",
  "Creating API documentation",
];

const mockThoughts = [
  "I should first understand the problem scope before proceeding...",
  "Let me break this down into smaller subtasks...",
  "Based on the data, I can see a pattern emerging...",
  "I need to verify this assumption with more evidence...",
  "This approach seems optimal for the given constraints...",
  "I'll use a divide-and-conquer strategy here...",
  "The results indicate a correlation between these factors...",
  "I should consider edge cases before finalizing...",
];

const mockActions = [
  "Executing API call to fetch latest data",
  "Writing results to output file",
  "Parsing JSON response from server",
  "Running validation checks on input",
  "Sending notification to user",
  "Updating database records",
  "Generating summary statistics",
  "Initiating background job",
];

const mockObservations = [
  "Response received: 200 OK with 42 records",
  "File successfully written to /output/results.json",
  "All validation checks passed",
  "Database updated with 15 new entries",
  "Processing completed in 2.3 seconds",
  "Found 7 matching patterns in dataset",
  "Memory usage: 45MB, CPU: 12%",
  "Rate limit: 85/100 requests remaining",
];

// Create a mock agent
export function createMockAgent(index: number): Agent {
  const statuses: AgentStatus[] = ["running", "idle", "paused", "error"];
  const frameworks = ["crewai", "langchain", "openai", "custom"] as const;
  const agentId = generateId();
  const agentName = mockAgentNames[index % mockAgentNames.length];
  const now = new Date().toISOString();

  return {
    id: agentId,
    config: {
      id: agentId,
      name: agentName,
      description: `AI agent for ${agentName.toLowerCase()} tasks`,
      framework: frameworks[Math.floor(Math.random() * frameworks.length)],
      model: Math.random() > 0.5 ? "gpt-4-turbo" : "claude-3-opus",
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt: "You are a helpful AI assistant.",
      tools: ["web_search", "code_execution", "file_access"],
      createdAt: now,
      updatedAt: now,
    },
    status: statuses[Math.floor(Math.random() * statuses.length)],
    currentTask: Math.random() > 0.3 ? mockTasks[Math.floor(Math.random() * mockTasks.length)] : null,
    runtime: Math.floor(Math.random() * 3600000),
    tokensUsed: Math.floor(Math.random() * 50000),
    lastActivity: now,
    errorMessage: null,
  };
}

// Generate initial mock agents
export function generateMockAgents(count: number = 3): Agent[] {
  return Array.from({ length: count }, (_, i) => createMockAgent(i));
}

// Generate a random activity
export function generateMockActivity(agent: Agent): Activity {
  const types: ActivityType[] = ["thought", "action", "observation", "status_change"];
  const type = types[Math.floor(Math.random() * types.length)];

  let content: string;
  switch (type) {
    case "thought":
      content = mockThoughts[Math.floor(Math.random() * mockThoughts.length)];
      break;
    case "action":
      content = mockActions[Math.floor(Math.random() * mockActions.length)];
      break;
    case "observation":
      content = mockObservations[Math.floor(Math.random() * mockObservations.length)];
      break;
    case "status_change":
      content = `Status changed to ${agent.status}`;
      break;
    default:
      content = "Unknown activity";
  }

  return {
    id: generateId(),
    agentId: agent.id,
    agentName: agent.config.name,
    type,
    content,
    timestamp: new Date().toISOString(),
    eventType: type,
    message: content,
  };
}

// Generate mock metrics
export function generateMockMetrics(agentId: string): AgentMetrics {
  return {
    agentId,
    timestamp: new Date(),
    tokensPerMinute: Math.floor(Math.random() * 500) + 100,
    tasksCompleted: Math.floor(Math.random() * 10),
    errorRate: Math.random() * 0.1,
    averageResponseTime: Math.random() * 2000 + 500,
  };
}

// Simulation controller
export class MockAgentSimulator {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private activityCallback: ((activity: Activity) => void) | null = null;
  private statusCallback: ((agentId: string, status: AgentStatus) => void) | null = null;
  private metricsCallback: ((agentId: string, metrics: AgentMetrics) => void) | null = null;
  private agents: Agent[] = [];

  setAgents(agents: Agent[]) {
    this.agents = agents;
  }

  onActivity(callback: (activity: Activity) => void) {
    this.activityCallback = callback;
  }

  onStatusChange(callback: (agentId: string, status: AgentStatus) => void) {
    this.statusCallback = callback;
  }

  onMetrics(callback: (agentId: string, metrics: AgentMetrics) => void) {
    this.metricsCallback = callback;
  }

  start(intervalMs: number = 3000) {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      // Pick a random running agent
      const runningAgents = this.agents.filter((a) => a.status === "running");
      if (runningAgents.length === 0) return;

      const agent = runningAgents[Math.floor(Math.random() * runningAgents.length)];

      // Generate activity
      if (this.activityCallback) {
        const activity = generateMockActivity(agent);
        this.activityCallback(activity);
      }

      // Occasionally change status
      if (Math.random() < 0.1 && this.statusCallback) {
        const newStatus: AgentStatus = Math.random() > 0.8 ? "error" : "running";
        this.statusCallback(agent.id, newStatus);
      }

      // Generate metrics
      if (this.metricsCallback && Math.random() < 0.3) {
        const metrics = generateMockMetrics(agent.id);
        this.metricsCallback(agent.id, metrics);
      }
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Singleton instance
export const mockSimulator = new MockAgentSimulator();
