import { memo } from 'react';
import type { Task } from '../types/task';
import styles from './TaskItem.module.css';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskItem = memo(function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}>
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
      <span className={styles.title}>{task.title}</span>
      <button
        className={styles.deleteButton}
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
      >
        ×
      </button>
    </div>
  );
});
