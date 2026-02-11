'use client';

import Link from 'next/link';
import { AgentForm } from '@/components/AgentForm';

export default function NewAgentPage() {
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
          <li className="text-gray-900 font-medium">Create Agent</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Agent</h1>
        <p className="text-gray-600 mt-1">
          Set up a new AI agent in just a few steps. Target: under 5 minutes.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <AgentForm mode="create" />
      </div>
    </div>
  );
}
