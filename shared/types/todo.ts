/**
 * Todo item data model
 */
export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data for creating a new todo
 */
export interface CreateTodoRequest {
  title: string;
}

/**
 * Data for updating an existing todo
 */
export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
}

/**
 * Filter types for todo list
 */
export type TodoFilter = 'all' | 'active' | 'completed';
