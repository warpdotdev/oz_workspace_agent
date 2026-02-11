// Re-export types from api.ts for backward compatibility
export type {
  Agent,
  AgentConfiguration,
  CreateAgentInput,
  UpdateAgentInput,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ApiResponse,
} from '@/lib/api';

export {
  AgentStatus,
  TaskStatus,
  TaskPriority,
} from '@/lib/api';
