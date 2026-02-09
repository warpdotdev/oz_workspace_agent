import { memo, useState, useRef, useEffect } from 'react';
import type { Task } from '../types/task';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}

export const TaskItem = memo(function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDelete = () => {
    setIsDeleting(true);
  };

  const handleAnimationEnd = () => {
    if (isDeleting) {
      onDelete(task.id);
    }
  };

  const handleDoubleClick = () => {
    if (!task.completed) {
      setIsEditing(true);
      setEditValue(task.title);
    }
  };

  const handleEditSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onEdit(task.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(task.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div
      className={`${styles.taskItem} ${task.completed ? styles.completed : ''} ${isDeleting ? styles.deleting : ''} ${isEditing ? styles.editing : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <button
        className={`${styles.checkbox} ${task.completed ? styles.checked : ''}`}
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className={styles.editInput}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={handleKeyDown}
          maxLength={200}
        />
      ) : (
        <span className={styles.title} onDoubleClick={handleDoubleClick}>
          <span className={styles.titleText}>{task.title}</span>
          <span className={styles.strikethrough} />
        </span>
      )}
      <button
        className={styles.deleteButton}
        onClick={handleDelete}
        aria-label="Delete task"
        disabled={isDeleting}
      >
        ×
      </button>
    </div>
  );
});
