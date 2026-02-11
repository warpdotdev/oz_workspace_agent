'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api, Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput } from '@/lib/api';
import { KanbanBoard, TaskDialog } from '@/components';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number> } | null>(
    null
  );

  // Load tasks
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.getTasks({ limit: 100 });
    if (result.error) {
      setError(result.error);
    } else {
      setTasks(result.data || []);
    }
    setLoading(false);
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    const result = await api.getTaskStats();
    if (result.data) {
      setStats(result.data);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadStats();
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      loadTasks();
      loadStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadTasks, loadStats]);

  // Handle status change (drag-drop)
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const result = await api.updateTask(taskId, { status: newStatus });
      if (result.error) {
        // Rollback on error
        setTasks(previousTasks);
        console.error('Failed to update task status:', result.error);
      } else {
        loadStats();
      }
    } catch (err) {
      setTasks(previousTasks);
      console.error('Failed to update task status:', err);
    }
  };

  // Handle create task
  const handleCreateTask = async (data: CreateTaskInput) => {
    const result = await api.createTask(data);
    if (result.error) {
      console.error('Failed to create task:', result.error);
    } else {
      loadTasks();
      loadStats();
    }
  };

  // Handle edit task
  const handleEditTask = async (data: { id: string } & Partial<Task>) => {
    const { id, ...updateData } = data;
    const result = await api.updateTask(id, updateData as UpdateTaskInput);
    if (result.error) {
      console.error('Failed to update task:', result.error);
    } else {
      loadTasks();
    }
  };

  // Handle delete task
  const handleDeleteTask = async (id: string) => {
    const result = await api.deleteTask(id);
    if (result.error) {
      console.error('Failed to delete task:', result.error);
    } else {
      loadTasks();
      loadStats();
    }
  };

  // Handle add task from column
  const handleAddTask = (status: TaskStatus) => {
    setDefaultStatus(status);
    setEditingTask(null);
    setDialogOpen(true);
  };

  // Handle edit task click
  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  // Handle dialog save
  const handleDialogSave = async (data: CreateTaskInput | ({ id: string } & Partial<Task>)) => {
    if ('id' in data) {
      await handleEditTask(data);
    } else {
      await handleCreateTask(data);
    }
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Board</h1>
          <p className="text-gray-600 mt-1">
            Manage your tasks with drag-and-drop Kanban board
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          {/* Stats summary */}
          {stats && (
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <span className="text-gray-500">
                Total: <span className="font-medium text-gray-900">{stats.total}</span>
              </span>
              {stats.byStatus.RUNNING !== undefined && stats.byStatus.RUNNING > 0 && (
                <span className="text-blue-600">
                  Running: <span className="font-medium">{stats.byStatus.RUNNING}</span>
                </span>
              )}
              {stats.byStatus.COMPLETED !== undefined && stats.byStatus.COMPLETED > 0 && (
                <span className="text-green-600">
                  Done: <span className="font-medium">{stats.byStatus.COMPLETED}</span>
                </span>
              )}
            </div>
          )}
          <button
            onClick={() => {
              setEditingTask(null);
              setDefaultStatus(TaskStatus.PENDING);
              setDialogOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Task
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && tasks.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
          <button onClick={loadTasks} className="ml-4 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tasks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks yet</h3>
          <p className="mt-2 text-gray-500">Get started by creating your first task.</p>
          <button
            onClick={() => {
              setEditingTask(null);
              setDefaultStatus(TaskStatus.PENDING);
              setDialogOpen(true);
            }}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create your first task
          </button>
        </div>
      )}

      {/* Kanban board */}
      {!loading && tasks.length > 0 && (
        <KanbanBoard
          tasks={tasks}
          onStatusChange={handleStatusChange}
          onEditTask={handleEditTaskClick}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTask}
        />
      )}

      {/* Task dialog */}
      <TaskDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTask(null);
        }}
        onSave={handleDialogSave}
        task={editingTask}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
