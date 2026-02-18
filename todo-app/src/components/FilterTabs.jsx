function FilterTabs({ filter, setFilter }) {
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setFilter(tab.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            filter === tab.id
              ? 'bg-white text-primary shadow-sm'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
          style={{ minHeight: '36px' }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default FilterTabs;
