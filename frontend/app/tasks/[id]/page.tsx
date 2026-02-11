'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { taskApi, agentApi } from '@/lib/api';
import { Task, Agent, TaskStatus, TaskPriority } from '@/types';

const statusColors: Record<TaskStatus, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  QUEUED: 'bg-blue-100 text-blue-800',
  RUNNING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-200 text-gray-600',
  PAUSED: 'bg-amber-100 text-amber-800',
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [taskResult, agentsResult] = await Promise.all([
        taskApi.get(resolvedParams.id),
        agentApi.list(),
      ]);

      if (taskResult.success && taskResult.data) {
        setTask(taskResult.data);
      } else {
        setError(taskResult.error || 'Task not found');
      }

      if (agentsResult.success && agentsResult.data) {
        setAgents(agentsResult.data);
      }

      setLoading(false);
    };
    fetchData();
  }, [resolvedParams.id]);

  const handleAction = async (action: () => Promise<{ success: boolean; error?: string; data?: Task }>) => {
    setActionLoading(true);
    setError(null);
    const result = await action();
    if (result.success && result.data) {
      setTask(result.data);
    } else {
      setError(result.error || 'Action failed');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setActionLoading(true);
    const result = await taskApi.delete(resolvedParams.id);
    if (result.success) {
      router.push('/tasks');
    } else {
      setError(result.error || 'Failed to delete task');
      setActionLoading(false);
    }
  };

  const handleAssign = async (agentId: string | null) => {
    await handleAction(() => taskApi.assign(resolvedParams.id, agentId));
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Task not found</h2>
        <Link href="/tasks" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Link href="/tasks" className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to Tasks
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
          <div className="mt-2 flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
              {task.status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {actionLoading ? (
            <span className="text-gray-400">Loading...</span>
          ) : (
            <>
              {(task.status === 'PENDING' || task.status === 'QUEUED') && (
                <button
                  onClick={() => handleAction(() => taskApi.start(resolvedParams.id))}
                  className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                >
                  Start
                </button>
              )}
              {task.status === 'RUNNING' && (
                <button
                  onClick={() => handleAction(() => taskApi.pause(resolvedParams.id))}
                  className="px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700"
                >
                  Pause
                </button>
              )}
              {task.status === 'PAUSED' && (
                <button
                  onClick={() => handleAction(() => taskApi.resume(resolvedParams.id))}
                  className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  Resume
                </button>
              )}
              {!['COMPLETED', 'CANCELLED', 'FAILED'].includes(task.status) && (
                <button
                  onClick={() => handleAction(() => taskApi.cancel(resolvedParams.id))}
                  className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Task details */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1 text-sm text-gray-900">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Created</h4>
              <p className="mt-1 text-sm text-gray-900">{formatDate(task.createdAt)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Updated</h4>
              <p className="mt-1 text-sm text-gray-900">{formatDate(task.updatedAt)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Started</h4>
              <p className="mt-1 text-sm text-gray-900">{formatDate(task.startedAt)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Completed</h4>
              <p className="mt-1 text-sm text-gray-900">{formatDate(task.completedAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Retry Count</h4>
              <p className="mt-1 text-sm text-gray-900">{task.retryCount} / {task.maxRetries}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Subtasks</h4>
              <p className="mt-1 text-sm text-gray-900">{task._count?.subtasks || 0}</p>
            </div>
          </div>

          {task.errorMessage && (
            <div>
              <h4 className="text-sm font-medium text-red-500">Error Message</h4>
              <p className="mt-1 text-sm text-red-700 bg-red-50 p-3 rounded">{task.errorMessage}</p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Assignment */}
      <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Agent Assignment</h3>
        </div>
        <div className="px-6 py-5">
          {task.agent ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{task.agent.name}</p>
                <p className="text-sm text-gray-500">Status: {task.agent.status}</p>
              </div>
              <button
                onClick={() => handleAssign(null)}
                className="text-sm text-red-600 hover:text-red-800"
                disabled={actionLoading}
              >
                Unassign
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">No agent assigned</p>
              <select
                onChange={(e) => e.target.value && handleAssign(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={actionLoading}
                defaultValue=""
              >
                <option value="" disabled>Select an agent to assign</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Input/Output */}
      {(Object.keys(task.input || {}).length > 0 || Object.keys(task.output || {}).length > 0) && (
        <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Input / Output</h3>
          </div>
          <div className="px-6 py-5 space-y-4">
            {Object.keys(task.input || {}).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Input</h4>
                <pre className="mt-1 text-sm bg-gray-50 p-3 rounded overflow-auto">
                  {JSON.stringify(task.input, null, 2)}
                </pre>
              </div>
            )}
            {task.output && Object.keys(task.output).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Output</h4>
                <pre className="mt-1 text-sm bg-green-50 p-3 rounded overflow-auto">
                  {JSON.stringify(task.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
