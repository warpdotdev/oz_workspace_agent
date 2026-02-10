import { useEffect, useState, useCallback } from "react";
import type { Todo } from "./types/todo";
import * as api from "./api/todos";
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";
import FilterTabs from "./components/FilterTabs";
import "./App.css";

type Filter = "all" | "active" | "completed";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  const loadTodos = useCallback(async () => {
    try {
      const filterParam = filter === "all" ? undefined : filter;
      const data = await api.fetchTodos(filterParam);
      setTodos(data);
    } catch (err) {
      console.error("Failed to load todos:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAdd = async (title: string) => {
    try {
      await api.createTodo(title);
      await loadTodos();
    } catch (err) {
      console.error("Failed to add todo:", err);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await api.toggleTodo(id);
      await loadTodos();
    } catch (err) {
      console.error("Failed to toggle todo:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTodo(id);
      await loadTodos();
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="app-title">Todo App</h1>
        <AddTodo onAdd={handleAdd} />
        <FilterTabs current={filter} onChange={setFilter} />
        {loading ? (
          <p className="loading">Loading...</p>
        ) : (
          <TodoList
            todos={todos}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
