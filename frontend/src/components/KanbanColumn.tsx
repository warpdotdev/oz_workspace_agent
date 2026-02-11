'use client';

import { Task, TaskStatus } from '@/lib/api';
import { TaskCard } from './TaskCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
  onTaskClick: (task: Task) => void;
}

// Color configs for columns (per design guidance)
const columnColors: Record<
  string,
  { bg: string; border: string; text: string; count: string }
> = {
  backlog: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
    count: 'bg-gray-200 text-gray-700',
  },
  'in-progress': {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    count: 'bg-blue-200 text-blue-700',
  },
  done: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    count: 'bg-green-200 text-green-700',
  },
};

export function KanbanColumn({
  status,
  title,
  tasks,
  color,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const colorConfig = columnColors[color] || columnColors.backlog;

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={`px-4 py-3 rounded-t-lg border-b-2 ${colorConfig.border} ${colorConfig.bg}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${colorConfig.text}`}>{title}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${colorConfig.count}`}
          >
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Column Body - Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 p-4 space-y-3 overflow-y-auto ${
          isOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : 'bg-gray-50'
        } rounded-b-lg min-h-[200px]`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No tasks
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
