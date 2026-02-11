'use client';

import { TaskStatus, TaskPriority } from '@/lib/api';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// Semantic colors for task status (per design guidance)
const statusConfig: Record<TaskStatus, { color: string; bgColor: string; label: string }> = {
  [TaskStatus.TODO]: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    label: 'Backlog',
  },
  [TaskStatus.IN_PROGRESS]: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    label: 'In Progress',
  },
  [TaskStatus.REVIEW]: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    label: 'Review',
  },
  [TaskStatus.DONE]: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    label: 'Done',
  },
  [TaskStatus.CANCELLED]: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    label: 'Cancelled',
  },
};

const priorityConfig: Record<TaskPriority, { color: string; bgColor: string; label: string }> = {
  [TaskPriority.LOW]: {
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    label: 'Low',
  },
  [TaskPriority.MEDIUM]: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    label: 'Medium',
  },
  [TaskPriority.HIGH]: {
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    label: 'High',
  },
  [TaskPriority.URGENT]: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    label: 'Urgent',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function TaskStatusBadge({ status, size = 'md', showLabel = true }: TaskStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig[TaskStatus.TODO];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      <span
        className={`${dotSizes[size]} rounded-full ${config.color.replace('text-', 'bg-')}`}
      />
      {showLabel && config.label}
    </span>
  );
}

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md' | 'lg';
}

export function TaskPriorityBadge({ priority, size = 'sm' }: TaskPriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}
