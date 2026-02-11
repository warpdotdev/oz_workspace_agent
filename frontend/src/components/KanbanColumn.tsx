'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/lib/api';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  title: string;
  color: { bg: string; border: string; text: string; headerBg: string };
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export function KanbanColumn({
  status,
  tasks,
  title,
  color,
  onDrop,
  onEditTask,
  onDeleteTask,
  onAddTask,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set to false if we're actually leaving the column
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDrop(taskId, status);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-lg ${color.bg} min-h-[500px] transition-all duration-200 ${
        isDragOver ? `ring-2 ring-offset-2 ${color.border}` : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div
        className={`px-4 py-3 rounded-t-lg ${color.headerBg} border-b ${color.border}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold ${color.text}`}>{title}</h3>
            <span
              className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full ${color.bg} ${color.text}`}
            >
              {tasks.length}
            </span>
          </div>
          {onAddTask && (
            <button
              onClick={() => onAddTask(status)}
              className={`p-1 rounded hover:bg-white/50 ${color.text} transition-colors`}
              title={`Add task to ${title}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tasks list */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {tasks.length === 0 ? (
          <div
            className={`flex items-center justify-center h-24 border-2 border-dashed rounded-lg ${color.border} opacity-50`}
          >
            <p className="text-sm text-gray-500">Drop tasks here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
