import { memo, useState, useRef, useEffect } from 'react';
import type { Task } from '../types/task';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export const TaskItem = memo(function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
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

  const startEditing = () => {
    if (!task.completed) {
      setEditValue(task.title);
      setIsEditing(true);
    }
  };

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onEdit(task.id, trimmed);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(task.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
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
        disabled={isEditing}
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
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          maxLength={200}
          aria-label="Edit task"
        />
      ) : (
        <span
          className={styles.title}
          onDoubleClick={startEditing}
        >
          <span className={styles.titleText}>{task.title}</span>
          <span className={styles.strikethrough} />
        </span>
      )}

      <div className={styles.actions}>
        {!task.completed && !isEditing && (
          <button
            className={styles.editButton}
            onClick={startEditing}
            aria-label="Edit task"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          aria-label="Delete task"
          disabled={isDeleting || isEditing}
        >
          ×
        </button>
      </div>
    </div>
  );
});
