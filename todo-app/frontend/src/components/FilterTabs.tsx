import { FilterType } from "../types/todo";

interface FilterTabsProps {
  current: FilterType;
  onChange: (filter: FilterType) => void;
  counts: { all: number; active: number; completed: number };
}

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
];

export default function FilterTabs({ current, onChange, counts }: FilterTabsProps) {
  return (
    <div className="filter-tabs">
      {filters.map((f) => (
        <button
          key={f.value}
          className={`filter-tab ${current === f.value ? "active" : ""}`}
          onClick={() => onChange(f.value)}
        >
          {f.label} ({counts[f.value]})
        </button>
      ))}
    </div>
  );
}
