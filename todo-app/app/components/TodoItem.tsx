"use client";

import { Todo } from "../types/todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => onToggle(todo.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          todo.completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 hover:border-green-400"
        }`}
        aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {todo.completed && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-gray-800 ${
          todo.completed ? "line-through text-gray-400" : ""
        }`}
      >
        {todo.text}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        aria-label="Delete todo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </li>
  );
}
