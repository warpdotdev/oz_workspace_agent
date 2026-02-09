import styles from './TodoFilter.module.css';

export type FilterType = 'all' | 'active' | 'completed';

interface TodoFilterProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  activeCount: number;
}

export function TodoFilter({ filter, onFilterChange, activeCount }: TodoFilterProps) {
  return (
    <div className={styles.filterContainer}>
      <span className={styles.itemCount}>
        {activeCount} item{activeCount !== 1 ? 's' : ''} left
      </span>
      <div className={styles.filters}>
        <button
          className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => onFilterChange('all')}
        >
          All
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'active' ? styles.active : ''}`}
          onClick={() => onFilterChange('active')}
        >
          Active
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'completed' ? styles.active : ''}`}
          onClick={() => onFilterChange('completed')}
        >
          Completed
        </button>
      </div>
    </div>
  );
}
