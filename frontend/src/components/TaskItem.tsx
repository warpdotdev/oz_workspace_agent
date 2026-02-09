import { useState } from 'react';
import { Task, UpdateTaskInput } from '../types/Task';

interface TaskItemProps {
  task: Task;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, completed: boolean) => Promise<void>;
}

export function TaskItem({ task, onUpdate, onDelete, onToggle }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      await onToggle(task.id, !task.completed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(task.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;

    setIsLoading(true);
    try {
      await onUpdate(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="task-item task-item-editing">
        <input
          type="text"
          className="task-edit-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          autoFocus
        />
        <input
          type="text"
          className="task-edit-input task-edit-description"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Description (optional)"
          disabled={isLoading}
        />
        <div className="task-actions">
          <button
            className="btn btn-small btn-success"
            onClick={handleSave}
            disabled={!editTitle.trim() || isLoading}
          >
            Save
          </button>
          <button
            className="btn btn-small btn-secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-item ${task.completed ? 'task-completed' : ''}`}>
      <div className="task-checkbox-wrapper">
        <input
          type="checkbox"
          className="task-checkbox"
          checked={task.completed}
          onChange={handleToggle}
          disabled={isLoading}
        />
      </div>
      <div className="task-content">
        <span className={`task-title ${task.completed ? 'task-title-completed' : ''}`}>
          {task.title}
        </span>
        {task.description && (
          <span className="task-description">{task.description}</span>
        )}
      </div>
      <div className="task-actions">
        <button
          className="btn btn-small btn-edit"
          onClick={handleEdit}
          disabled={isLoading}
          title="Edit task"
        >
          Edit
        </button>
        <button
          className="btn btn-small btn-danger"
          onClick={handleDelete}
          disabled={isLoading}
          title="Delete task"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
