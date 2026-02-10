export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
}

export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
}

/** Row shape from SQLite (snake_case columns) */
export interface TodoRow {
  id: number;
  title: string;
  completed: number; // SQLite stores booleans as 0/1
  created_at: string;
  updated_at: string;
}

export function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
