import { useEffect, useState } from 'react';
import type { Todo, TodoFilter } from '@shared/types/todo';
import { AddTodo } from './components/AddTodo';
import { TodoList } from './components/TodoList';
import { FilterTabs } from './components/FilterTabs';
import { fetchTodos, createTodo, updateTodo, deleteTodo, toggleTodo } from './services/api';
import './App.css';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load todos on mount and when filter changes
  useEffect(() => {
    loadTodos();
  }, [filter]);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTodos(filter);
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (title: string) => {
    try {
      await createTodo({ title });
      await loadTodos();
    } catch (err) {
      setError('Failed to add todo');
      console.error(err);
    }
  };

  const handleToggleTodo = async (id: number) => {
    try {
      await toggleTodo(id);
      await loadTodos();
    } catch (err) {
      setError('Failed to toggle todo');
      console.error(err);
    }
  };

  const handleUpdateTodo = async (id: number, title: string) => {
    try {
      await updateTodo(id, { title });
      await loadTodos();
    } catch (err) {
      setError('Failed to update todo');
      console.error(err);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await deleteTodo(id);
      await loadTodos();
    } catch (err) {
      setError('Failed to delete todo');
      console.error(err);
    }
  };

  const handleFilterChange = (newFilter: TodoFilter) => {
    setFilter(newFilter);
  };

  // Calculate counts for all filters
  const getCounts = () => {
    // We need to fetch all todos to get accurate counts
    // For now, we'll just show the current filtered count
    // In a production app, you'd want to maintain separate state for counts
    return {
      all: todos.length,
      active: todos.filter(t => !t.completed).length,
      completed: todos.filter(t => t.completed).length,
    };
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo App</h1>
      </header>
      <main className="app-main">
        <AddTodo onAdd={handleAddTodo} />
        <FilterTabs
          currentFilter={filter}
          onFilterChange={handleFilterChange}
          counts={getCounts()}
        />
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <TodoList
            todos={todos}
            onToggle={handleToggleTodo}
            onUpdate={handleUpdateTodo}
            onDelete={handleDeleteTodo}
          />
        )}
      </main>
    </div>
  );
}

export default App;
