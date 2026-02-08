export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl mb-4" role="img" aria-label="Notepad">
        📝
      </span>
      <p className="text-gray-500 text-base">
        No tasks yet!
      </p>
      <p className="text-gray-400 text-sm mt-1">
        Add one above to get started.
      </p>
    </div>
  );
}
