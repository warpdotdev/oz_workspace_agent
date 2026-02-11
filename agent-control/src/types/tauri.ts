/**
 * TypeScript type definitions for Tauri IPC commands
 * 
 * These types match the Rust models defined in src-tauri/src/models.rs
 */

export type AgentStatus = 'running' | 'idle' | 'error' | 'paused';

export type ActivityType = 'thought' | 'status' | 'error' | 'task';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  current_task: string | null;
  runtime_seconds: number;
  tokens_used: number;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface Activity {
  id: string;
  agent_id: string;
  activity_type: ActivityType;
  message: string;
  details: string | null;
  timestamp: string; // ISO 8601
}

export interface Task {
  id: string;
  agent_id: string;
  description: string;
  status: string;
  created_at: string; // ISO 8601
  completed_at: string | null; // ISO 8601
}

export interface AgentStats {
  total_agents: number;
  running: number;
  idle: number;
  error: number;
}

export interface DispatchTaskRequest {
  agent_id: string;
  description: string;
}

export interface UpdateAgentStatusRequest {
  agent_id: string;
  status: AgentStatus;
}

/**
 * Tauri Command API
 * 
 * Import this interface to get type-safe access to Tauri commands.
 */
export interface TauriCommands {
  /**
   * Get all agents
   */
  get_agents(): Promise<Agent[]>;

  /**
   * Get a specific agent by ID
   */
  get_agent(args: { id: string }): Promise<Agent | null>;

  /**
   * Get activities, optionally filtered by agent
   */
  get_activities(args: {
    agent_id?: string;
    limit?: number;
  }): Promise<Activity[]>;

  /**
   * Get all tasks for a specific agent
   */
  get_tasks(args: { agent_id: string }): Promise<Task[]>;

  /**
   * Dispatch a new task to an agent
   */
  dispatch_task(args: { request: DispatchTaskRequest }): Promise<Task>;

  /**
   * Update an agent's status
   */
  update_agent_status(args: { request: UpdateAgentStatusRequest }): Promise<void>;

  /**
   * Get aggregate statistics for all agents
   */
  get_agent_stats(): Promise<AgentStats>;
}
