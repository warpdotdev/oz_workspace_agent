'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/lib/api';
import { DraggableTaskCard } from './DraggableTaskCard';
import { TaskStatusBadge } from '@/components/TaskBadges';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function KanbanColumn({ id, title, tasks, onEdit, onDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Column header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
            {tasks.length}
          </span>
        </div>
        <TaskStatusBadge status={id} size="sm" showLabel={false} />
      </div>

      {/* Task list */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] p-3 rounded-lg border-2 border-dashed transition-colors ${
          isOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-gray-400">No tasks</p>
              </div>
            ) : (
              tasks.map((task) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
