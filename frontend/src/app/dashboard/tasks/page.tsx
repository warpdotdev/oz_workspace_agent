'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { api, Task, TaskStatus } from '@/lib/api';
import { TaskCard } from '@/components/TaskCard';
import { KanbanColumn } from './components/KanbanColumn';
import { useTaskWebSocket } from '@/lib/websocket';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: TaskStatus.TODO, title: 'Backlog' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress' },
  { id: TaskStatus.REVIEW, title: 'Review' },
  { id: TaskStatus.DONE, title: 'Done' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { connect, disconnect, on, off } = useTaskWebSocket();

  async function loadTasks() {
    setLoading(true);
    const result = await api.getTasks();
    if (result.error) {
      setError(result.error);
    } else {
      setTasks(result.data || []);
    }
    setLoading(false);
  }

  // Load tasks
  useEffect(() => {
    loadTasks();
  }, []);

  // WebSocket real-time updates
  useEffect(() => {
    const handleTaskCreated = (event: { data: Record<string, unknown> }) => {
      setTasks((prevTasks) => [...prevTasks, event.data as Task]);
    };

    const handleTaskUpdated = (event: { data: Record<string, unknown> }) => {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === (event.data as Task).id ? (event.data as Task) : task
        )
      );
    };

    const handleTaskDeleted = (event: { data: Record<string, unknown> }) => {
      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== (event.data as Task).id)
      );
    };

    // Connect to WebSocket and subscribe to events
    connect();
    on('task:created', handleTaskCreated);
    on('task:updated', handleTaskUpdated);
    on('task:deleted', handleTaskDeleted);

    // Cleanup on unmount
    return () => {
      off('task:created', handleTaskCreated);
      off('task:updated', handleTaskUpdated);
      off('task:deleted', handleTaskDeleted);
      disconnect();
    };
  }, [connect, disconnect, on, off]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overColumnId = over.id as TaskStatus;

    // Update task status optimistically
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === activeTaskId ? { ...task, status: overColumnId } : task
      )
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Update task status in backend
    const result = await api.updateTask(taskId, { status: newStatus });
    if (result.error) {
      setError(`Failed to update task: ${result.error}`);
      // Reload tasks to revert optimistic update
      loadTasks();
    }
  }

  async function handleDeleteTask(taskId: string) {
    const result = await api.deleteTask(taskId);
    if (result.error) {
      setError(`Failed to delete task: ${result.error}`);
    } else {
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
    }
  }

  function handleEditTask(task: Task) {
    // TODO: Open edit modal/dialog
    console.log('Edit task:', task);
  }

  function getTasksByStatus(status: TaskStatus): Task[] {
    return tasks.filter((task) => task.status === status);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Board</h1>
        <p className="text-gray-600">Manage and track your tasks</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.id)}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
