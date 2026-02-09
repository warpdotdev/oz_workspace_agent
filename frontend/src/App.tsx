import { useState, useEffect, useCallback } from 'react';
import type { Todo, FilterType } from 'shared';
import * as api from './api/todos';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import FilterTabs from './components/FilterTabs';
import './App.css';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchTodos(filter);
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAddTodo = async (title: string) => {
    try {
      const newTodo = await api.createTodo(title);
      setTodos((prev) => [newTodo, ...prev]);
    } catch (err) {
      setError('Failed to add todo');
      console.error(err);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const updated = await api.toggleTodo(id);
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updated : todo))
      );
    } catch (err) {
      setError('Failed to update todo');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTodo(id);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
      console.error(err);
    }
  };

  const handleUpdate = async (id: number, title: string) => {
    try {
      const updated = await api.updateTodo(id, { title });
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? updated : todo))
      );
    } catch (err) {
      setError('Failed to update todo');
      console.error(err);
    }
  };

  const activeTodosCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="app">
      <h1>Todo App</h1>
      
      <AddTodo onAdd={handleAddTodo} />
      
      <FilterTabs filter={filter} onFilterChange={setFilter} />
      
      {error && <div className="error">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <TodoList
          todos={todos}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
      
      <div className="footer">
        {activeTodosCount} item{activeTodosCount !== 1 ? 's' : ''} left
      </div>
    </div>
  );
}

export default App;
