import type { FilterType } from 'shared';

interface FilterTabsProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

function FilterTabs({ filter, onFilterChange }: FilterTabsProps) {
  const filters: FilterType[] = ['all', 'active', 'completed'];

  return (
    <div className="filter-tabs">
      {filters.map((f) => (
        <button
          key={f}
          className={`filter-btn ${filter === f ? 'active' : ''}`}
          onClick={() => onFilterChange(f)}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
    </div>
  );
}

export default FilterTabs;
