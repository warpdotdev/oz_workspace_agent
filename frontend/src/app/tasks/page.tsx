'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from '@dnd-kit/core';
import { api, Task, TaskStatus, TaskPriority, Agent, CreateTaskInput } from '@/lib/api';
import { KanbanColumn } from '@/components/KanbanColumn';
import { TaskModal } from '@/components/TaskModal';
import { TaskDetail } from '@/components/TaskDetail';
import { TaskCard } from '@/components/TaskCard';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // Drag state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Filters
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [agentFilter, setAgentFilter] = useState<string>('');

  // Fetch tasks and agents
  const fetchTasks = async () => {
    const response = await api.getTasks({
      priority: priorityFilter || undefined,
      agentId: agentFilter || undefined,
    });
    if (response.data) {
      setTasks(response.data);
      setError(null);
    } else if (response.error) {
      setError(response.error);
    }
  };

  const fetchAgents = async () => {
    const response = await api.getAgents();
    if (response.data) {
      setAgents(response.data);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchAgents()]);
      setLoading(false);
    };
    loadData();
  }, [priorityFilter, agentFilter]);

  // Real-time polling (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [priorityFilter, agentFilter]);

  // Map tasks to columns (Backlog, In Progress, Done)
  const getTasksByStatus = (statuses: TaskStatus[]) => {
    return tasks.filter((task) => statuses.includes(task.status));
  };

  const backlogTasks = getTasksByStatus([TaskStatus.PENDING, TaskStatus.QUEUED]);
  const inProgressTasks = getTasksByStatus([TaskStatus.RUNNING]);
  const doneTasks = getTasksByStatus([TaskStatus.COMPLETED]);

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // Update on server
    const response = await api.updateTask(taskId, { status: newStatus });
    if (response.error) {
      // Rollback on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
      alert(`Failed to update task: ${response.error}`);
    }
  };

  const handleDragStart = (event: any) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  // Handle create task
  const handleCreateTask = async (input: CreateTaskInput) => {
    const response = await api.createTask(input);
    if (response.data) {
      setTasks((prev) => [...prev, response.data!]);
      setIsCreateModalOpen(false);
    } else if (response.error) {
      throw new Error(response.error);
    }
  };

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsDetailOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleUpdateTask = async (input: CreateTaskInput) => {
    if (!editingTask) return;

    const response = await api.updateTask(editingTask.id, input);
    if (response.data) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? response.data! : t))
      );
      setIsCreateModalOpen(false);
      setEditingTask(undefined);
    } else if (response.error) {
      throw new Error(response.error);
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    const response = await api.deleteTask(taskId);
    if (response.error) {
      alert(`Failed to delete task: ${response.error}`);
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  // Handle task click
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <button
            onClick={() => {
              setEditingTask(undefined);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
          >
            + Create Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mr-2">
              Priority:
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All</option>
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.CRITICAL}>Critical</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mr-2">
              Agent:
            </label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            Total: {tasks.length} tasks
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto">
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KanbanColumn
              status={TaskStatus.PENDING}
              title="Backlog"
              color="backlog"
              tasks={backlogTasks}
              onTaskClick={handleTaskClick}
            />
            <KanbanColumn
              status={TaskStatus.RUNNING}
              title="In Progress"
              color="in-progress"
              tasks={inProgressTasks}
              onTaskClick={handleTaskClick}
            />
            <KanbanColumn
              status={TaskStatus.COMPLETED}
              title="Done"
              color="done"
              tasks={doneTasks}
              onTaskClick={handleTaskClick}
            />
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(undefined);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        agents={agents}
        editTask={editingTask}
      />

      <TaskDetail
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        onDelete={handleDeleteTask}
        onEdit={handleEditTask}
      />
    </div>
  );
}
