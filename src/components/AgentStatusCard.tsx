import React from 'react';

export type AgentStatus = 'running' | 'error' | 'idle' | 'paused';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  lastActivity: string;
  tasksCompleted: number;
  description?: string;
}

interface AgentStatusCardProps {
  agent: Agent;
  onClick?: () => void;
  isSelected?: boolean;
}

const statusConfig = {
  running: {
    color: 'bg-green-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Running',
  },
  error: {
    color: 'bg-red-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Error',
  },
  idle: {
    color: 'bg-gray-500',
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    label: 'Idle',
  },
  paused: {
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'Paused',
  },
};

export const AgentStatusCard: React.FC<AgentStatusCardProps> = ({
  agent,
  onClick,
  isSelected = false,
}) => {
  const config = statusConfig[agent.status];

  return (
    <div
      onClick={onClick}
      className={`
        relative p-4 rounded-lg border cursor-pointer
        transition-all duration-200 ease-in-out
        ${config.bgColor} ${config.borderColor}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''}
        hover:bg-opacity-20 hover:scale-[1.02]
      `}
    >
      {/* Status Indicator */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
        <span className={`text-xs font-medium uppercase tracking-wider ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {/* Agent Name */}
      <h3 className="text-white font-semibold text-lg mb-1">{agent.name}</h3>

      {/* Description */}
      {agent.description && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{agent.description}</p>
      )}

      {/* Metrics */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Tasks: {agent.tasksCompleted}</span>
        <span>{agent.lastActivity}</span>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
