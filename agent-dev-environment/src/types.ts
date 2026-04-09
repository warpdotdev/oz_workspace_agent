export type AgentStatus = "running" | "errored" | "deploying" | "paused" | "stopped";

export type TabId = "editor" | "schedule" | "identity" | "environments" | "observe";

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  description: string;
  lastActive: string;
}

export interface Workspace {
  id: string;
  name: string;
  agentCount: number;
}
