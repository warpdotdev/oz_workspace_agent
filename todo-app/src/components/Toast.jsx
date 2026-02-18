function Toast({ message, onUndo, onClose }) {
  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 animate-slide-up">
      <span className="text-sm">{message}</span>
      <div className="flex gap-2">
        {onUndo && (
          <button
            onClick={() => {
              onUndo();
              onClose();
            }}
            className="text-primary hover:text-blue-400 font-medium text-sm transition-colors"
          >
            Undo
          </button>
        )}
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Toast;
