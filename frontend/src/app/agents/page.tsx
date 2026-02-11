'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Agent, AgentStatus } from '@/lib/api';
import { AgentCard } from '@/components/AgentCard';
import { StatusBadge } from '@/components/StatusBadge';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AgentStatus | 'all'>('all');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const result = await api.getAgents();
    if (result.error) {
      setError(result.error);
    } else {
      setAgents(result.data || []);
    }
    setLoading(false);
  };

  const handleStart = async (id: string) => {
    const result = await api.startAgent(id);
    if (!result.error) {
      loadAgents();
    }
  };

  const handleStop = async (id: string) => {
    const result = await api.stopAgent(id);
    if (!result.error) {
      loadAgents();
    }
  };

  const handleDelete = async (id: string) => {
    const result = await api.deleteAgent(id);
    if (!result.error) {
      loadAgents();
    }
  };

  const filteredAgents = filter === 'all' 
    ? agents 
    : agents.filter(a => a.status === filter);

  const statusCounts = {
    all: agents.length,
    [AgentStatus.IDLE]: agents.filter(a => a.status === AgentStatus.IDLE).length,
    [AgentStatus.RUNNING]: agents.filter(a => a.status === AgentStatus.RUNNING).length,
    [AgentStatus.PAUSED]: agents.filter(a => a.status === AgentStatus.PAUSED).length,
    [AgentStatus.ERROR]: agents.filter(a => a.status === AgentStatus.ERROR).length,
    [AgentStatus.COMPLETED]: agents.filter(a => a.status === AgentStatus.COMPLETED).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600 mt-1">
            Manage your AI agents across all frameworks
          </p>
        </div>
        <Link
          href="/agents/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Agent
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', AgentStatus.IDLE, AgentStatus.RUNNING, AgentStatus.PAUSED, AgentStatus.ERROR, AgentStatus.COMPLETED] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : <StatusBadge status={status} size="sm" />}
            <span className="ml-1.5">({statusCounts[status]})</span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
          <button
            onClick={loadAgents}
            className="ml-4 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredAgents.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No agents yet</h3>
          <p className="mt-2 text-gray-500">
            {filter === 'all' 
              ? 'Get started by creating your first AI agent.'
              : 'No agents with this status.'}
          </p>
          {filter === 'all' && (
            <Link
              href="/agents/new"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create your first agent
            </Link>
          )}
        </div>
      )}

      {/* Agent grid */}
      {!loading && !error && filteredAgents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onStart={handleStart}
              onStop={handleStop}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
