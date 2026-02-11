'use client';

import { Task } from '@/lib/api';
import { PriorityBadge } from './PriorityBadge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 flex-1 line-clamp-2">
          {task.title}
        </h3>
        <PriorityBadge priority={task.priority} size="sm" />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Assigned Agent */}
      {task.agent && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-700">
              {task.agent.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-gray-600">{task.agent.name}</span>
        </div>
      )}

      {/* Error message if failed */}
      {task.errorMessage && (
        <div className="mb-3 p-2 bg-red-50 rounded text-xs text-red-700">
          {task.errorMessage}
        </div>
      )}

      {/* Footer - Timestamp and retry count */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
        <span>{new Date(task.createdAt).toLocaleDateString()}</span>
        {task.retryCount > 0 && (
          <span className="text-amber-600">
            Retries: {task.retryCount}/{task.maxRetries}
          </span>
        )}
      </div>
    </div>
  );
}
