'use client';

import { AgentStatus } from '@/lib/api';

interface StatusBadgeProps {
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// Semantic colors for trust calibration (per design guidance)
const statusConfig: Record<AgentStatus, { color: string; bgColor: string; label: string }> = {
  [AgentStatus.IDLE]: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    label: 'Idle',
  },
  [AgentStatus.RUNNING]: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    label: 'Working',
  },
  [AgentStatus.PAUSED]: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    label: 'Paused',
  },
  [AgentStatus.ERROR]: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    label: 'Error',
  },
  [AgentStatus.COMPLETED]: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    label: 'Completed',
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

export function StatusBadge({ status, size = 'md', showLabel = true }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig[AgentStatus.IDLE];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      <span
        className={`${dotSizes[size]} rounded-full ${
          status === AgentStatus.RUNNING ? 'animate-pulse' : ''
        } ${config.color.replace('text-', 'bg-')}`}
      />
      {showLabel && config.label}
    </span>
  );
}

// Confidence indicator for trust calibration
interface ConfidenceBadgeProps {
  score: number; // 0-100
  size?: 'sm' | 'md';
}

export function ConfidenceBadge({ score, size = 'md' }: ConfidenceBadgeProps) {
  let color: string;
  let label: string;

  if (score >= 80) {
    color = 'bg-green-100 text-green-700';
    label = 'High';
  } else if (score >= 50) {
    color = 'bg-yellow-100 text-yellow-700';
    label = 'Medium';
  } else {
    color = 'bg-red-100 text-red-700';
    label = 'Low';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${color} ${sizeClasses[size]}`}
      title={`Confidence: ${score}%`}
    >
      <span className="font-mono">{score}%</span>
      <span className="text-xs opacity-75">{label}</span>
    </span>
  );
}
