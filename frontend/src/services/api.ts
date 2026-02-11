import type { Todo, CreateTodoRequest, UpdateTodoRequest, TodoFilter } from '@shared/types/todo';

const API_BASE = '/api';

/**
 * Fetch all todos with optional filter
 */
export async function fetchTodos(filter: TodoFilter = 'all'): Promise<Todo[]> {
  const url = filter === 'all' ? `${API_BASE}/todos` : `${API_BASE}/todos?filter=${filter}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch todos');
  }
  return response.json();
}

/**
 * Create a new todo
 */
export async function createTodo(data: CreateTodoRequest): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create todo');
  }
  return response.json();
}

/**
 * Update an existing todo
 */
export async function updateTodo(id: number, data: UpdateTodoRequest): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update todo');
  }
  return response.json();
}

/**
 * Delete a todo
 */
export async function deleteTodo(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete todo');
  }
}

/**
 * Toggle todo completion status
 */
export async function toggleTodo(id: number): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos/${id}/toggle`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to toggle todo');
  }
  return response.json();
}
