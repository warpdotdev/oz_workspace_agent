'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { Todo } from '../types/todo';
import { saveTodos, generateId } from '../utils/localStorage';
import TodoItem from './TodoItem';

const STORAGE_KEY = 'todos';

function getSnapshot(): Todo[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function getServerSnapshot(): Todo[] {
  return [];
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export default function TodoList() {
  const todosFromStorage = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [todos, setTodosState] = useState<Todo[]>(todosFromStorage);
  const [newTodoText, setNewTodoText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const setTodos = useCallback((newTodos: Todo[] | ((prev: Todo[]) => Todo[])) => {
    setTodosState((prevTodos) => {
      const updatedTodos = typeof newTodos === 'function' ? newTodos(prevTodos) : newTodos;
      saveTodos(updatedTodos);
      return updatedTodos;
    });
  }, []);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newTodo: Todo = {
      id: generateId(),
      text: newTodoText.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    setTodos((prev) => [newTodo, ...prev]);
    setNewTodoText('');
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const editTodo = (id: string, newText: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, text: newText } : todo
      )
    );
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const activeTodosCount = todos.filter((todo) => !todo.completed).length;
  const completedTodosCount = todos.filter((todo) => todo.completed).length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Add Todo Form */}
      <form onSubmit={addTodo} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newTodoText.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium
                       hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                       transition-colors"
          >
            Add
          </button>
        </div>
      </form>

      {/* Filter Buttons */}
      {todos.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'active'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Active ({activeTodosCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'completed'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Completed ({completedTodosCount})
          </button>
          {completedTodosCount > 0 && (
            <button
              onClick={clearCompleted}
              className="ml-auto px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 
                         dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Clear Completed
            </button>
          )}
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-2">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {todos.length === 0
              ? 'No todos yet. Add one above!'
              : filter === 'active'
              ? 'No active todos.'
              : 'No completed todos.'}
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={editTodo}
            />
          ))
        )}
      </div>

      {/* Footer Stats */}
      {todos.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 text-center">
          {activeTodosCount} item{activeTodosCount !== 1 ? 's' : ''} left to complete
        </div>
      )}
    </div>
  );
}
