import { Agent, CreateAgentInput, ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
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
    updates: Partial<Agent>
  ): Promise<ApiResponse<Agent>> => {
    return fetchApi<Agent>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/agents/${id}`, {
      method: 'DELETE',
    });
  },
};
