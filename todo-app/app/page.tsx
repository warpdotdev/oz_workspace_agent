"use client";

import { useCallback } from "react";
import { AddTodo, TodoList } from "./components";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { Todo } from "./types/todo";

export default function Home() {
  const [todos, setTodos] = useLocalStorage<Todo[]>("todos", []);

  const handleAddTodo = useCallback((text: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [newTodo, ...prev]);
  }, [setTodos]);

  const handleToggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, [setTodos]);

  const handleDeleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, [setTodos]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">To-Do List</h1>
          <p className="text-gray-600">Keep track of your tasks</p>
        </header>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <AddTodo onAdd={handleAddTodo} />
          <TodoList
            todos={todos}
            onToggle={handleToggleTodo}
            onDelete={handleDeleteTodo}
          />
        </div>
      </div>
    </div>
  );
}
