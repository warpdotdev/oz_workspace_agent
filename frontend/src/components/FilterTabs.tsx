import type { TodoFilter } from '@shared/types/todo';

interface FilterTabsProps {
  currentFilter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
  counts: {
    all: number;
    active: number;
    completed: number;
  };
}

export function FilterTabs({ currentFilter, onFilterChange, counts }: FilterTabsProps) {
  const filters: { value: TodoFilter; label: string }[] = [
    { value: 'all', label: `All (${counts.all})` },
    { value: 'active', label: `Active (${counts.active})` },
    { value: 'completed', label: `Completed (${counts.completed})` },
  ];

  return (
    <div className="filter-tabs">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onFilterChange(value)}
          className={`filter-tab ${currentFilter === value ? 'active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
