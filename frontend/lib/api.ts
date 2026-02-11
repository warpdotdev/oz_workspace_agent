import { 
  Agent, 
  CreateAgentInput, 
  UpdateAgentInput,
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ApiResponse,
  TaskStats,
  TaskStatus,
  TaskPriority,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || `API error: ${response.statusText}`,
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

export interface TaskQueryParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  agentId?: string;
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export const agentApi = {
  list: async (): Promise<ApiResponse<Agent[]>> => {
    return fetchApi<Agent[]>('/agents');
  },

  get: async (id: string): Promise<ApiResponse<Agent>> => {
    return fetchApi<Agent>(`/agents/${id}`);
  },

  create: async (input: CreateAgentInput): Promise<ApiResponse<Agent>> => {
    return fetchApi<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update: async (
    id: string,
    updates: UpdateAgentInput
  ): Promise<ApiResponse<Agent>> => {
    return fetchApi<Agent>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/agents/${id}`, {
      method: 'DELETE',
    });
  },

  start: async (id: string): Promise<ApiResponse<Agent>> => {
    return fetchApi<Agent>(`/agents/${id}/start`, { method: 'POST' });
  },

  stop: async (id: string): Promise<ApiResponse<Agent>> => {
    return fetchApi<Agent>(`/agents/${id}/stop`, { method: 'POST' });
  },

  pause: async (id: string): Promise<ApiResponse<Agent>> => {
    return fetchApi<Agent>(`/agents/${id}/pause`, { method: 'POST' });
  },

  resume: async (id: string): Promise<ApiResponse<Agent>> => {
    return fetchApi<Agent>(`/agents/${id}/resume`, { method: 'POST' });
  },
};

export const taskApi = {
  list: async (params?: TaskQueryParams): Promise<ApiResponse<Task[]>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return fetchApi<Task[]>(`/tasks${query ? `?${query}` : ''}`);
  },

  get: async (id: string): Promise<ApiResponse<Task>> => {
    return fetchApi<Task>(`/tasks/${id}`);
  },

  create: async (input: CreateTaskInput): Promise<ApiResponse<Task>> => {
    return fetchApi<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update: async (id: string, updates: UpdateTaskInput): Promise<ApiResponse<Task>> => {
    return fetchApi<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  start: async (id: string): Promise<ApiResponse<Task>> => {
    return fetchApi<Task>(`/tasks/${id}/start`, { method: 'POST' });
  },

  complete: async (id: string, output?: Record<string, unknown>): Promise<ApiResponse<Task>> => {
    return fetchApi<Task>(`/tasks/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ output: output || {} }),
    });
  },

  fail: async (id: string, errorMessage: string): Promise<ApiResponse<Task>> => {
    return fetchApi<Task>(`/tasks/${id}/fail`, {
      method: 'POST',
      body: JSON.stringify({ errorMessage }),
    });
  },

  cancel: async (id: string): Promise<ApiResponse<Task>> => {
    return fetchApi<Task>(`/tasks/${id}/cancel`, { method: 'POST' });
  },

  pause: async (id: string): Promise<ApiResponse<Task>> => {
    return fetchApi<Task>(`/tasks/${id}/pause`, { method: 'POST' });
  },

  resume: async (id: string): Promise<ApiResponse<Task>> => {
    return fetchApi<Task>(`/tasks/${id}/resume`, { method: 'POST' });
  },

  assign: async (id: string, agentId: string | null): Promise<ApiResponse<Task>> => {
    return fetchApi<Task>(`/tasks/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  },

  getSubtasks: async (id: string): Promise<ApiResponse<Task[]>> => {
    return fetchApi<Task[]>(`/tasks/${id}/subtasks`);
  },

  getStats: async (): Promise<ApiResponse<TaskStats>> => {
    return fetchApi<TaskStats>('/tasks/stats');
  },
};
