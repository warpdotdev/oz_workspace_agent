type Filter = "all" | "active" | "completed";

interface FilterTabsProps {
  current: Filter;
  onChange: (filter: Filter) => void;
}

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
];

export default function FilterTabs({ current, onChange }: FilterTabsProps) {
  return (
    <div className="filter-tabs">
      {filters.map((f) => (
        <button
          key={f.value}
          className={`filter-tab ${current === f.value ? "active" : ""}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
