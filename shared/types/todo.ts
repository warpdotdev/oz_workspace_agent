export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TodoCreate = Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>;
export type TodoUpdate = Partial<TodoCreate>;

export type FilterType = 'all' | 'active' | 'completed';
