import { memo, useState } from 'react';
import type { Task } from '../types/task';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskItem = memo(function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
  };

  const handleAnimationEnd = () => {
    if (isDeleting) {
      onDelete(task.id);
    }
  };

  return (
    <div
      className={`${styles.taskItem} ${task.completed ? styles.completed : ''} ${isDeleting ? styles.deleting : ''}`}
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
      <span className={styles.title}>
        <span className={styles.titleText}>{task.title}</span>
        <span className={styles.strikethrough} />
      </span>
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
