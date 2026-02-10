import type { Todo, TodoCreate, TodoUpdate } from '../types/todo'

const API_BASE_URL = '/api'

export const todosApi = {
  // TODO: Implement in Phase 3
  getAll: async (): Promise<Todo[]> => {
    const response = await fetch(`${API_BASE_URL}/todos`)
    if (!response.ok) throw new Error('Failed to fetch todos')
    return response.json()
  },

  create: async (todo: TodoCreate): Promise<Todo> => {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo)
    })
    if (!response.ok) throw new Error('Failed to create todo')
    return response.json()
  },

  update: async (id: number, updates: TodoUpdate): Promise<Todo> => {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update todo')
    return response.json()
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete todo')
  },

  toggle: async (id: number): Promise<Todo> => {
    const response = await fetch(`${API_BASE_URL}/todos/${id}/toggle`, {
      method: 'PATCH'
    })
    if (!response.ok) throw new Error('Failed to toggle todo')
    return response.json()
  }
}
