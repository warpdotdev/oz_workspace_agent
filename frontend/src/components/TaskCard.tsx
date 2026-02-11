'use client';

import { Task } from '@/lib/api';
import { TaskPriorityBadge } from './TaskBadges';
import { ConfidenceBadge } from './StatusBadge';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, isDragging = false }: TaskCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Header with priority and confidence */}
      <div className="flex items-start justify-between mb-2">
        <TaskPriorityBadge priority={task.priority} />
        {task.confidenceScore !== undefined && (
          <ConfidenceBadge score={task.confidenceScore} size="sm" />
        )}
      </div>

      {/* Task title */}
      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
        {task.title}
      </h3>

      {/* Task description */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Due date */}
      {task.dueDate && (
        <div className="flex items-center gap-1 mb-3">
          <svg
            className="w-3 h-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs text-gray-500">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {onEdit && (
          <button
            onClick={() => onEdit(task)}
            className="flex-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this task?')) {
                onDelete(task.id);
              }
            }}
            className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {/* Footer with updated timestamp */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Updated {new Date(task.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
