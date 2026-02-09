/**
 * Shared Todo types used across frontend and backend
 */

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

export type TodoFilter = 'all' | 'active' | 'completed';
