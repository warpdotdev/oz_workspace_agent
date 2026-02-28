/**
 * AgentOS Typed API Layer
 *
 * Provides typed wrappers around Tauri invoke commands for all database entities.
 * Each function calls the corresponding Rust backend command via IPC.
 */
import { invoke } from "@tauri-apps/api/core";

// ── Response type ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// ── Entity types ────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: "idle" | "running" | "error" | "paused" | "deploying";
  framework: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  tools: string; // JSON string array
  currentTask: string | null;
  tokensUsed: number;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFile {
  id: string;
  agentId: string;
  name: string;
  path: string;
  fileType: "markdown" | "memory" | "skill" | "config";
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  agentId: string;
  name: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  agentId: string;
  name: string;
  envType: "development" | "staging" | "production";
  variables: string; // JSON string object
  dockerImage: string | null;
  status: "inactive" | "active" | "deploying" | "error";
  deployedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  agentId: string;
  name: string;
  keyPrefix: string; // e.g. "sk-...abc"
  permissions: string; // JSON string array
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  agentId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: string; // JSON string
  performedBy: string;
  createdAt: string;
}

// ── Input types ─────────────────────────────────────────────────────────

export interface CreateAgentInput {
  name: string;
  description?: string;
  framework?: string;
  model?: string;
  systemPrompt?: string;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  status?: string;
  framework?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: string;
  currentTask?: string;
}

export interface CreateFileInput {
  agentId: string;
  name: string;
  path: string;
  fileType?: string;
  content?: string;
}

export interface UpdateFileInput {
  name?: string;
  content?: string;
}

export interface CreateScheduleInput {
  agentId: string;
  name: string;
  cronExpression: string;
  timezone?: string;
  description?: string;
}

export interface UpdateScheduleInput {
  name?: string;
  cronExpression?: string;
  timezone?: string;
  enabled?: boolean;
  description?: string;
}

export interface CreateEnvironmentInput {
  agentId: string;
  name: string;
  envType?: string;
  variables?: string;
  dockerImage?: string;
}

export interface UpdateEnvironmentInput {
  name?: string;
  envType?: string;
  variables?: string;
  dockerImage?: string;
  status?: string;
}

export interface CreateApiKeyInput {
  agentId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions?: string;
  expiresAt?: string;
}

// ── Helper ──────────────────────────────────────────────────────────────

async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const response = await invoke<ApiResponse<T>>(cmd, args);
  if (!response.success || response.data === null) {
    throw new Error(response.error ?? `Command '${cmd}' failed`);
  }
  return response.data;
}

// ── Agents API ──────────────────────────────────────────────────────────

export const agentsApi = {
  list: () => call<Agent[]>("list_agents"),
  get: (id: string) => call<Agent>("get_agent", { id }),
  create: (input: CreateAgentInput) => call<Agent>("create_agent", { input }),
  update: (id: string, input: UpdateAgentInput) =>
    call<Agent>("update_agent", { id, input }),
  delete: (id: string) => call<boolean>("delete_agent", { id }),
};

// ── Files API ───────────────────────────────────────────────────────────

export const filesApi = {
  list: (agentId: string) => call<AgentFile[]>("list_files", { agentId }),
  create: (input: CreateFileInput) => call<AgentFile>("create_file", { input }),
  update: (id: string, input: UpdateFileInput) =>
    call<AgentFile>("update_file", { id, input }),
  delete: (id: string) => call<boolean>("delete_file", { id }),
};

// ── Schedules API ───────────────────────────────────────────────────────

export const schedulesApi = {
  list: (agentId: string) => call<Schedule[]>("list_schedules", { agentId }),
  create: (input: CreateScheduleInput) =>
    call<Schedule>("create_schedule", { input }),
  update: (id: string, input: UpdateScheduleInput) =>
    call<Schedule>("update_schedule", { id, input }),
  delete: (id: string) => call<boolean>("delete_schedule", { id }),
};

// ── Environments API ────────────────────────────────────────────────────

export const environmentsApi = {
  list: (agentId: string) =>
    call<Environment[]>("list_environments", { agentId }),
  create: (input: CreateEnvironmentInput) =>
    call<Environment>("create_environment", { input }),
  update: (id: string, input: UpdateEnvironmentInput) =>
    call<Environment>("update_environment", { id, input }),
  delete: (id: string) => call<boolean>("delete_environment", { id }),
};

// ── API Keys API ────────────────────────────────────────────────────────

export const apiKeysApi = {
  list: (agentId: string) => call<ApiKey[]>("list_api_keys", { agentId }),
  create: (input: CreateApiKeyInput) =>
    call<ApiKey>("create_api_key", { input }),
  revoke: (id: string) => call<boolean>("revoke_api_key", { id }),
  delete: (id: string) => call<boolean>("delete_api_key", { id }),
};

// ── Audit Log API ───────────────────────────────────────────────────────

export const auditLogApi = {
  list: (agentId?: string, limit?: number) =>
    call<AuditLogEntry[]>("list_audit_log", { agentId, limit }),
};
