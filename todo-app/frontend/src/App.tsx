import { useState, useEffect, useCallback } from "react";
import { Todo, FilterType } from "./types/todo";
import * as api from "./api/todos";
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";
import FilterTabs from "./components/FilterTabs";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      setError(null);
      const data = await api.fetchTodos();
      setTodos(data);
    } catch {
      setError("Failed to load todos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAdd = async (title: string) => {
    try {
      const newTodo = await api.createTodo(title);
      setTodos((prev) => [newTodo, ...prev]);
    } catch {
      setError("Failed to add todo");
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const updated = await api.toggleTodo(id);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError("Failed to toggle todo");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete todo");
    }
  };

  const handleUpdate = async (id: number, title: string) => {
    try {
      const updated = await api.updateTodo(id, { title });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch {
      setError("Failed to update todo");
    }
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const counts = {
    all: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  if (loading) {
    return <div className="app"><p className="loading">Loading...</p></div>;
  }

  return (
    <div className="app">
      <h1 className="app-title">Todo App</h1>
      {error && <p className="error-message">{error}</p>}
      <AddTodo onAdd={handleAdd} />
      <FilterTabs current={filter} onChange={setFilter} counts={counts} />
      <TodoList
        todos={filteredTodos}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
