'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Agent } from '@/types';
import { agentApi } from '@/lib/api';

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgent = async () => {
    setLoading(true);
    const result = await agentApi.get(params.id);
    if (result.error) {
      setError(result.error);
    } else {
      setAgent(result.data || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Load agent data when ID changes - standard pattern for client-side data fetching
    loadAgent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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
        <div className="text-gray-600">Loading agent...</div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div>
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading agent</h3>
              <div className="mt-2 text-sm text-red-700">{error || 'Agent not found'}</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          ← Back to agents
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                agent.status
              )}`}
            >
              {agent.status}
            </span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-2 text-base text-gray-900">{agent.description}</p>
          </div>

          {agent.framework && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Framework</h3>
              <p className="mt-2 text-base text-gray-900">{agent.framework}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-2 text-base text-gray-900">
                {new Date(agent.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p className="mt-2 text-base text-gray-900">
                {new Date(agent.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {agent.lastActiveAt && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Last Activity</h3>
              <p className="mt-2 text-base text-gray-900">
                {new Date(agent.lastActiveAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
