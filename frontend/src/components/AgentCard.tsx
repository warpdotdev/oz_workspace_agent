'use client';

import Link from 'next/link';
import { Agent, AgentStatus } from '@/lib/api';
import { StatusBadge } from './StatusBadge';

interface AgentCardProps {
  agent: Agent;
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AgentCard({ agent, onStart, onStop, onDelete }: AgentCardProps) {
  const canStart = agent.status === AgentStatus.IDLE || agent.status === AgentStatus.PAUSED;
  const canStop = agent.status === AgentStatus.RUNNING;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <Link 
              href={`/agents/${agent.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate block"
            >
              {agent.name}
            </Link>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {agent.description}
            </p>
          </div>
          <StatusBadge status={agent.status} size="sm" />
        </div>

        {/* Framework badge */}
        {agent.configuration?.framework && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
              {agent.configuration.framework}
            </span>
          </div>
        )}

        {/* Capabilities */}
        {agent.capabilities && agent.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {agent.capabilities.slice(0, 3).map((cap, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs"
              >
                {cap}
              </span>
            ))}
            {agent.capabilities.length > 3 && (
              <span className="text-xs text-gray-400">
                +{agent.capabilities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {canStart && onStart && (
            <button
              onClick={() => onStart(agent.id)}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
            >
              Start
            </button>
          )}
          {canStop && onStop && (
            <button
              onClick={() => onStop(agent.id)}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-md hover:bg-amber-100 transition-colors"
            >
              Stop
            </button>
          )}
          <Link
            href={`/agents/${agent.id}/edit`}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            Edit
          </Link>
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this agent?')) {
                  onDelete(agent.id);
                }
              }}
              className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Timestamp footer */}
      <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <p className="text-xs text-gray-400">
          Updated {new Date(agent.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
