'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api, Agent } from '@/lib/api';
import { AgentForm } from '@/components/AgentForm';

interface EditAgentPageProps {
  params: Promise<{ id: string }>;
}

export default function EditAgentPage({ params }: EditAgentPageProps) {
  const resolvedParams = use(params);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <li>
            <Link href={`/agents/${agent.id}`} className="hover:text-gray-700 truncate max-w-xs">
              {agent.name}
            </Link>
          </li>
          <li>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-900 font-medium">Edit</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Agent</h1>
        <p className="text-gray-600 mt-1">
          Update the configuration for {agent.name}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <AgentForm
          mode="edit"
          agentId={agent.id}
          initialData={{
            name: agent.name,
            description: agent.description,
            capabilities: agent.capabilities,
            configuration: agent.configuration,
          }}
        />
      </div>
    </div>
  );
}
