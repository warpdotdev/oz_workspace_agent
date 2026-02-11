import { invoke } from '@tauri-apps/api/core';
import type { Agent, AgentEvent, Task, AgentFramework } from '../types';

// Request types matching Rust structs
export interface CreateAgentRequest {
  name: string;
  description: string;
  framework: AgentFramework;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: string[];
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: string[];
}

export interface DispatchTaskRequest {
  agentId: string;
  instruction: string;
}

// Agent API
export async function getAgents(): Promise<Agent[]> {
  return invoke<Agent[]>('get_agents');
}

export async function getAgent(id: string): Promise<Agent> {
  return invoke<Agent>('get_agent', { id });
}

export async function createAgent(request: CreateAgentRequest): Promise<Agent> {
  return invoke<Agent>('create_agent', { request });
}

export async function updateAgent(id: string, request: UpdateAgentRequest): Promise<Agent> {
  return invoke<Agent>('update_agent', { id, request });
}

export async function deleteAgent(id: string): Promise<void> {
  return invoke<void>('delete_agent', { id });
}

// Task API
export async function dispatchTask(request: DispatchTaskRequest): Promise<Task> {
  return invoke<Task>('dispatch_task', { request });
}

export async function getTask(id: string): Promise<Task> {
  return invoke<Task>('get_task', { id });
}

export async function getAgentTasks(agentId: string): Promise<Task[]> {
  return invoke<Task[]>('get_agent_tasks', { agentId });
}

// Events API
export async function getEvents(limit?: number): Promise<AgentEvent[]> {
  return invoke<AgentEvent[]>('get_events', { limit });
}

export async function getAgentEvents(agentId: string, limit?: number): Promise<AgentEvent[]> {
  return invoke<AgentEvent[]>('get_agent_events', { agentId, limit });
}

// Mock data seeding for demo
export async function seedMockData(): Promise<Agent[]> {
  return invoke<Agent[]>('seed_mock_data');
}
