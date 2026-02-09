import { Task, CreateTaskInput, UpdateTaskInput } from '../types/Task';

const API_BASE = '/api/tasks';

export const taskApi = {
  async getAll(): Promise<Task[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return response.json();
  },

  async getByFilter(completed?: boolean): Promise<Task[]> {
    const url = completed !== undefined 
      ? `${API_BASE}?completed=${completed}` 
      : API_BASE;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return response.json();
  },

  async getById(id: string): Promise<Task> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch task');
    }
    return response.json();
  },

  async create(input: CreateTaskInput): Promise<Task> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    return response.json();
  },

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  },

  async toggleComplete(id: string, completed: boolean): Promise<Task> {
    return this.update(id, { completed });
  },
};
