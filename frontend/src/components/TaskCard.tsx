'use client';

import { Task, TaskStatus, TaskPriority } from '@/lib/api';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

// Priority colors following design-lead's specs
const priorityColors: Record<TaskPriority, { dot: string; label: string }> = {
  [TaskPriority.CRITICAL]: { dot: 'bg-red-500', label: 'text-red-700' },
  [TaskPriority.HIGH]: { dot: 'bg-orange-500', label: 'text-orange-700' },
  [TaskPriority.MEDIUM]: { dot: 'bg-yellow-500', label: 'text-yellow-700' },
  [TaskPriority.LOW]: { dot: 'bg-gray-400', label: 'text-gray-600' },
};

// Confidence badge colors (0.8-1.0: green, 0.5-0.79: amber, <0.5: red)
function getConfidenceBadge(score?: number): { bg: string; text: string; label: string } | null {
  if (score === undefined || score === null) return null;
  if (score >= 0.8) return { bg: 'bg-green-100', text: 'text-green-700', label: 'High' };
  if (score >= 0.5) return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' };
  return { bg: 'bg-red-100', text: 'text-red-700', label: 'Low' };
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  draggable = true,
  onDragStart,
}: TaskCardProps) {
  const priority = priorityColors[task.priority];
  const confidence = getConfidenceBadge(task.confidenceScore);

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, task);
    }
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200"
    >
      {/* Header with title and priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {task.priority !== TaskPriority.LOW && (
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.dot}`}
              title={task.priority}
            />
          )}
          <h4
            className={`text-sm font-medium text-gray-900 truncate ${
              task.priority === TaskPriority.CRITICAL ? 'font-bold' : ''
            }`}
          >
            {task.title}
          </h4>
        </div>

        {/* Actions dropdown */}
        <div className="flex-shrink-0 relative group">
          <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          <div className="absolute right-0 top-6 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
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
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Footer with metadata */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Agent assignment */}
        {task.agent && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {task.agent.name}
          </span>
        )}

        {/* Confidence badge */}
        {confidence && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs ${confidence.bg} ${confidence.text}`}
          >
            {Math.round((task.confidenceScore || 0) * 100)}%
          </span>
        )}

        {/* Requires review indicator */}
        {task.requiresReview && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Review
          </span>
        )}

        {/* Subtasks count */}
        {task.subtasks && task.subtasks.length > 0 && (
          <span className="inline-flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {task.subtasks.filter((s) => s.status === TaskStatus.COMPLETED).length}/
            {task.subtasks.length}
          </span>
        )}

        {/* Error indicator */}
        {task.status === TaskStatus.FAILED && task.errorMessage && (
          <span
            className="inline-flex items-center text-xs text-red-600"
            title={task.errorMessage}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}
