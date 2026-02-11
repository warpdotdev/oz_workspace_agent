'use client';

import { TaskPriority } from '@/lib/api';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

// Semantic colors for priority levels (per design guidance)
const priorityConfig: Record<
  TaskPriority,
  { color: string; bgColor: string; label: string }
> = {
  [TaskPriority.LOW]: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    label: 'Low',
  },
  [TaskPriority.MEDIUM]: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    label: 'Medium',
  },
  [TaskPriority.HIGH]: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    label: 'High',
  },
  [TaskPriority.CRITICAL]: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    label: 'Critical',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig[TaskPriority.MEDIUM];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}
