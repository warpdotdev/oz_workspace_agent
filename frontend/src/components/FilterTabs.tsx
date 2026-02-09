import { FilterType } from '../types/Task';

interface FilterTabsProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  taskCounts: {
    all: number;
    active: number;
    completed: number;
  };
}

export function FilterTabs({ currentFilter, onFilterChange, taskCounts }: FilterTabsProps) {
  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="filter-tabs">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          className={`filter-tab ${currentFilter === value ? 'filter-tab-active' : ''}`}
          onClick={() => onFilterChange(value)}
        >
          {label}
          <span className="filter-count">{taskCounts[value]}</span>
        </button>
      ))}
    </div>
  );
}
