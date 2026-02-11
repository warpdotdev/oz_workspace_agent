'use client';

import { Task, TaskStatus } from '@/lib/api';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  onAddTask?: (status: TaskStatus) => void;
}

// Column configuration following design-lead's semantic color mapping
const COLUMNS: Array<{
  status: TaskStatus;
  title: string;
  color: { bg: string; border: string; text: string; headerBg: string };
}> = [
  {
    status: TaskStatus.PENDING,
    title: 'Backlog',
    color: {
      bg: 'bg-gray-50',
      border: 'border-gray-300',
      text: 'text-gray-700',
      headerBg: 'bg-gray-100',
    },
  },
  {
    status: TaskStatus.RUNNING,
    title: 'In Progress',
    color: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-700',
      headerBg: 'bg-blue-100',
    },
  },
  {
    status: TaskStatus.PAUSED,
    title: 'Review',
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-700',
      headerBg: 'bg-amber-100',
    },
  },
  {
    status: TaskStatus.COMPLETED,
    title: 'Done',
    color: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-700',
      headerBg: 'bg-green-100',
    },
  },
];

// Map statuses to columns (some statuses share columns)
function getColumnStatus(status: TaskStatus): TaskStatus {
  switch (status) {
    case TaskStatus.PENDING:
    case TaskStatus.QUEUED:
    case TaskStatus.CANCELLED:
    case TaskStatus.FAILED:
      return TaskStatus.PENDING; // Backlog
    case TaskStatus.RUNNING:
      return TaskStatus.RUNNING; // In Progress
    case TaskStatus.PAUSED:
      return TaskStatus.PAUSED; // Review
    case TaskStatus.COMPLETED:
      return TaskStatus.COMPLETED; // Done
    default:
      return TaskStatus.PENDING;
  }
}

export function KanbanBoard({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onAddTask,
}: KanbanBoardProps) {
  // Group tasks by column status
  const tasksByColumn = COLUMNS.reduce((acc, column) => {
    acc[column.status] = tasks.filter(
      (task) => getColumnStatus(task.status) === column.status
    );
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDrop = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && getColumnStatus(task.status) !== newStatus) {
      onStatusChange(taskId, newStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {COLUMNS.map((column) => (
        <KanbanColumn
          key={column.status}
          status={column.status}
          title={column.title}
          color={column.color}
          tasks={tasksByColumn[column.status] || []}
          onDrop={handleDrop}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onAddTask={onAddTask}
        />
      ))}
    </div>
  );
}
