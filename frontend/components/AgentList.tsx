'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Agent } from '@/types';
import { agentApi } from '@/lib/api';

export default function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = async () => {
    setLoading(true);
    const result = await agentApi.list();
    if (result.error) {
      setError(result.error);
    } else {
      setAgents(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Load agents on component mount - standard pattern for client-side data fetching
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAgents();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) {
      return;
    }

    const result = await agentApi.delete(id);
    if (result.error) {
      alert(result.error);
    } else {
      loadAgents();
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'TERMINATED':
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading agents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading agents</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No agents</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new agent.
        </p>
        <div className="mt-6">
          <Link
            href="/agents/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Create Agent
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {agent.name}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{agent.description}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                agent.status
              )}`}
            >
              {agent.status}
            </span>
          </div>

          {agent.framework && (
            <div className="mt-4">
              <span className="text-xs text-gray-500">Framework: </span>
              <span className="text-xs font-medium text-gray-700">
                {agent.framework}
              </span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Created {new Date(agent.createdAt).toLocaleDateString()}
            </span>
            <div className="flex gap-2">
              <Link
                href={`/agents/${agent.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View
              </Link>
              <button
                onClick={() => handleDelete(agent.id)}
                className="text-sm font-medium text-red-600 hover:text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
