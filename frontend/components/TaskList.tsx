'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { taskApi } from '@/lib/api';

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate?: () => void;
}

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

const priorityIcons: Record<TaskPriority, string> = {
  LOW: '↓',
  MEDIUM: '→',
  HIGH: '↑',
  CRITICAL: '⚡',
};

export default function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (taskId: string, action: () => Promise<void>) => {
    setLoading(taskId);
    setError(null);
    try {
      await action();
      onTaskUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(null);
    }
  };

  const handleStart = (taskId: string) => handleAction(taskId, async () => {
    const result = await taskApi.start(taskId);
    if (!result.success) throw new Error(result.error);
  });

  const handlePause = (taskId: string) => handleAction(taskId, async () => {
    const result = await taskApi.pause(taskId);
    if (!result.success) throw new Error(result.error);
  });

  const handleResume = (taskId: string) => handleAction(taskId, async () => {
    const result = await taskApi.resume(taskId);
    if (!result.success) throw new Error(result.error);
  });

  const handleCancel = (taskId: string) => handleAction(taskId, async () => {
    const result = await taskApi.cancel(taskId);
    if (!result.success) throw new Error(result.error);
  });

  const handleDelete = (taskId: string) => handleAction(taskId, async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const result = await taskApi.delete(taskId);
    if (!result.success) throw new Error(result.error);
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
        <div className="mt-6">
          <Link
            href="/tasks/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            + New Task
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <ul className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <li key={task.id} className="hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    {/* Priority indicator */}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}
                      title={`Priority: ${task.priority}`}
                    >
                      {priorityIcons[task.priority]} {task.priority}
                    </span>

                    {/* Task title */}
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate"
                    >
                      {task.title}
                    </Link>

                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}
                    >
                      {task.status === 'RUNNING' && (
                        <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {task.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {loading === task.id ? (
                      <span className="text-gray-400 text-sm">Loading...</span>
                    ) : (
                      <>
                        {(task.status === 'PENDING' || task.status === 'QUEUED') && (
                          <button
                            onClick={() => handleStart(task.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Start
                          </button>
                        )}
                        {task.status === 'RUNNING' && (
                          <button
                            onClick={() => handlePause(task.id)}
                            className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                          >
                            Pause
                          </button>
                        )}
                        {task.status === 'PAUSED' && (
                          <button
                            onClick={() => handleResume(task.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Resume
                          </button>
                        )}
                        {!['COMPLETED', 'CANCELLED', 'FAILED'].includes(task.status) && (
                          <button
                            onClick={() => handleCancel(task.id)}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Task details row */}
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex sm:space-x-4 text-sm text-gray-500">
                    {task.description && (
                      <p className="truncate max-w-md">{task.description}</p>
                    )}
                    {task.agent && (
                      <span className="flex items-center">
                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        Agent: {task.agent.name}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 sm:mt-0 text-sm text-gray-500">
                    <span title={`Created: ${new Date(task.createdAt).toLocaleString()}`}>
                      {formatDate(task.createdAt)}
                    </span>
                    {task.retryCount > 0 && (
                      <span className="ml-2 text-amber-600">
                        (Retry {task.retryCount}/{task.maxRetries})
                      </span>
                    )}
                    {task.errorMessage && (
                      <span className="ml-2 text-red-600 truncate max-w-xs" title={task.errorMessage}>
                        Error: {task.errorMessage.slice(0, 50)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
