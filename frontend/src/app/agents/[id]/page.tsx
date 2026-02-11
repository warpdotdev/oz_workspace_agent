'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Agent, AgentStatus } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDetailPage({ params }: AgentDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAgent = async () => {
    setLoading(true);
    const result = await api.getAgent(resolvedParams.id);
    if (result.error) {
      setError(result.error);
    } else {
      setAgent(result.data || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAgent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.id]);

  const handleAction = async (action: 'start' | 'stop' | 'pause' | 'delete') => {
    if (!agent) return;
    setActionLoading(true);

    let result;
    switch (action) {
      case 'start':
        result = await api.startAgent(agent.id);
        break;
      case 'stop':
        result = await api.stopAgent(agent.id);
        break;
      case 'pause':
        result = await api.pauseAgent(agent.id);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this agent?')) {
          result = await api.deleteAgent(agent.id);
          if (!result.error) {
            router.push('/agents');
            return;
          }
        }
        setActionLoading(false);
        return;
    }

    if (!result?.error) {
      loadAgent();
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || 'Agent not found'}
          <Link href="/agents" className="ml-4 underline hover:no-underline">
            Back to agents
          </Link>
        </div>
      </div>
    );
  }

  const canStart = agent.status === AgentStatus.IDLE || agent.status === AgentStatus.PAUSED;
  const canStop = agent.status === AgentStatus.RUNNING;
  const canPause = agent.status === AgentStatus.RUNNING;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/agents" className="hover:text-gray-700">
              Agents
            </Link>
          </li>
          <li>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-900 font-medium truncate max-w-xs">{agent.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <StatusBadge status={agent.status} size="md" />
          </div>
          <p className="text-gray-600">{agent.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          {canStart && (
            <button
              onClick={() => handleAction('start')}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition-colors"
            >
              Start
            </button>
          )}
          {canStop && (
            <button
              onClick={() => handleAction('stop')}
              disabled={actionLoading}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:bg-gray-300 transition-colors"
            >
              Stop
            </button>
          )}
          {canPause && (
            <button
              onClick={() => handleAction('pause')}
              disabled={actionLoading}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:bg-gray-300 transition-colors"
            >
              Pause
            </button>
          )}
          <Link
            href={`/agents/${agent.id}/edit`}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => handleAction('delete')}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 disabled:bg-gray-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Framework</label>
                  <p className="mt-1 text-gray-900">{agent.configuration?.framework || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Model</label>
                  <p className="mt-1 text-gray-900">{agent.configuration?.model || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Temperature</label>
                  <p className="mt-1 text-gray-900">{agent.configuration?.temperature ?? 'Default'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Max Tokens</label>
                  <p className="mt-1 text-gray-900">{agent.configuration?.maxTokens || 'Default'}</p>
                </div>
              </div>
              {agent.configuration?.systemPrompt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">System Prompt</label>
                  <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
                    {agent.configuration.systemPrompt}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Capabilities */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Capabilities</h2>
            </div>
            <div className="px-6 py-4">
              {agent.capabilities && agent.capabilities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No capabilities configured</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick info */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Details</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{agent.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(agent.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(agent.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Status card with trust indicator */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Status</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={agent.status} size="lg" />
              </div>
              {agent.status === AgentStatus.ERROR && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">
                    This agent encountered an error. Review the logs and retry.
                  </p>
                </div>
              )}
              {agent.status === AgentStatus.RUNNING && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Agent is currently running. Monitor progress below.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
