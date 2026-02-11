'use client';

import { Agent } from '@/lib/api';
import { StatusBadge } from './StatusBadge';

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgentId?: string;
  onChange: (agentId: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function AgentSelector({
  agents,
  selectedAgentId,
  onChange,
  label = 'Assign to Agent',
  placeholder = 'Select an agent...',
  disabled = false,
}: AgentSelectorProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        value={selectedAgentId || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name} - {agent.status}
          </option>
        ))}
      </select>
      
      {/* Show selected agent details */}
      {selectedAgentId && agents.find((a) => a.id === selectedAgentId) && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
          <StatusBadge
            status={agents.find((a) => a.id === selectedAgentId)!.status}
            size="sm"
          />
          <span className="text-xs text-gray-600">
            {agents.find((a) => a.id === selectedAgentId)?.description}
          </span>
        </div>
      )}
    </div>
  );
}
