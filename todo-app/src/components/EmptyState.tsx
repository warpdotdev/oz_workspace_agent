import styles from './EmptyState.module.css';

export function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <span className={styles.icon}>📝</span>
      <p className={styles.title}>No tasks yet!</p>
      <p className={styles.subtitle}>Add one above to get started.</p>
    </div>
  );
}
