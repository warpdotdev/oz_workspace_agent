'use client';

import { Task, TaskStatus } from '@/lib/api';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface TaskDetailProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'Pending',
  [TaskStatus.QUEUED]: 'Queued',
  [TaskStatus.RUNNING]: 'Running',
  [TaskStatus.COMPLETED]: 'Completed',
  [TaskStatus.FAILED]: 'Failed',
  [TaskStatus.CANCELLED]: 'Cancelled',
  [TaskStatus.PAUSED]: 'Paused',
};

export function TaskDetail({
  task,
  isOpen,
  onClose,
  onDelete,
  onEdit,
}: TaskDetailProps) {
  if (!isOpen || !task) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Slide-out drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Priority */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-2xl font-bold text-gray-900">{task.title}</h3>
              <PriorityBadge priority={task.priority} />
            </div>
            {task.description && (
              <p className="text-gray-600 mt-2">{task.description}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-2">
              Status
            </label>
            <span className="text-lg font-medium text-gray-900">
              {statusLabels[task.status]}
            </span>
          </div>

          {/* Assigned Agent */}
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-2">
              Assigned Agent
            </label>
            {task.agent ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-lg font-medium text-white">
                    {task.agent.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{task.agent.name}</p>
                  <p className="text-sm text-gray-500">{task.agent.description}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No agent assigned</p>
            )}
          </div>

          {/* Execution Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-1">
                Retry Count
              </label>
              <p className="text-gray-900">
                {task.retryCount} / {task.maxRetries}
              </p>
            </div>
            {task.startedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Started At
                </label>
                <p className="text-gray-900">
                  {new Date(task.startedAt).toLocaleString()}
                </p>
              </div>
            )}
            {task.completedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Completed At
                </label>
                <p className="text-gray-900">
                  {new Date(task.completedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {task.errorMessage && (
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Error Message
              </label>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-mono">
                  {task.errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Input/Output */}
          {task.input && Object.keys(task.input).length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Input
              </label>
              <pre className="p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(task.input, null, 2)}
              </pre>
            </div>
          )}

          {task.output && Object.keys(task.output).length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Output
              </label>
              <pre className="p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(task.output, null, 2)}
              </pre>
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-500 block mb-1">Created</label>
                <p className="text-gray-900">
                  {new Date(task.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-gray-500 block mb-1">Updated</label>
                <p className="text-gray-900">
                  {new Date(task.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              Edit Task
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this task?')) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
            >
              Delete Task
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
