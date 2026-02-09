import styles from './TodoFilters.module.css';

export type FilterType = 'all' | 'active' | 'completed';

interface TodoFiltersProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  itemsLeft: number;
}

export function TodoFilters({ currentFilter, onFilterChange, itemsLeft }: TodoFiltersProps) {
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className={styles.filters}>
      <span className={styles.count}>
        {itemsLeft} item{itemsLeft !== 1 ? 's' : ''} left
      </span>
      <div className={styles.buttons}>
        {filters.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.btn} ${currentFilter === key ? styles.btnActive : ''}`}
            onClick={() => onFilterChange(key)}
            aria-pressed={currentFilter === key}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
