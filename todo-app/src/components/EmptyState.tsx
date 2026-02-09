import styles from './EmptyState.module.css';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.icon}>📝</span>
      <p className={styles.title}>{message || 'No tasks yet!'}</p>
      {!message && <p className={styles.subtitle}>Add one above to get started.</p>}
    </div>
  );
}
