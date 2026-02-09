import type { Todo, FilterType, UpdateTodoInput } from 'shared';

const API_BASE = '/api/todos';

export async function fetchTodos(filter: FilterType = 'all'): Promise<Todo[]> {
  const url = filter === 'all' ? API_BASE : `${API_BASE}?filter=${filter}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch todos');
  }
  return response.json();
}

export async function createTodo(title: string): Promise<Todo> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error('Failed to create todo');
  }
  return response.json();
}

export async function updateTodo(id: number, data: UpdateTodoInput): Promise<Todo> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update todo');
  }
  return response.json();
}

export async function toggleTodo(id: number): Promise<Todo> {
  const response = await fetch(`${API_BASE}/${id}/toggle`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to toggle todo');
  }
  return response.json();
}

export async function deleteTodo(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete todo');
  }
}
