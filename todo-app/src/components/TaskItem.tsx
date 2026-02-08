import { memo, useState } from 'react';
import type { Task } from '../types/task';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskItem = memo(function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    onToggle(task.id);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => onDelete(task.id), 150);
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200
        hover:shadow-sm transition-all duration-150 group
        ${isDeleting ? 'task-exit' : 'task-enter'}
      `}
      role="listitem"
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-all duration-150 flex-shrink-0
          ${task.completed 
            ? 'bg-emerald-500 border-emerald-500' 
            : 'border-gray-300 hover:border-blue-500'
          }
          ${isAnimating ? 'checkbox-bounce' : ''}
        `}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed && (
          <svg 
            className="w-3 h-3 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        )}
      </button>

      {/* Task title */}
      <span
        className={`
          flex-1 text-base transition-all duration-200
          ${task.completed 
            ? 'text-gray-400 line-through' 
            : 'text-gray-900'
          }
        `}
      >
        {task.title}
      </span>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="
          opacity-0 group-hover:opacity-100 md:group-hover:opacity-100
          text-gray-400 hover:text-red-500 
          transition-all duration-150 p-1 rounded
          focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500
          max-md:opacity-100
        "
        aria-label="Delete task"
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      </button>
    </div>
  );
});
