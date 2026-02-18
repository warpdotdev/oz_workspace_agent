import { useState } from 'react';

function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    onToggle(task.id);
  };

  const handleEdit = () => {
    if (editText.trim() && editText !== task.text) {
      onEdit(task.id, editText.trim());
    } else {
      setEditText(task.text);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all group ${
        task.completed ? 'opacity-60' : ''
      }`}
      style={{ minHeight: '44px' }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`flex-shrink-0 w-6 h-6 rounded border-2 transition-all ${
          task.completed
            ? 'bg-success border-success'
            : 'border-gray-300 hover:border-primary'
        } ${isAnimating ? 'checkbox-animate' : ''}`}
        style={{ minWidth: '24px', minHeight: '24px' }}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed && (
          <svg
            className="w-full h-full text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </button>

      {/* Task Text */}
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-primary rounded focus:outline-none"
          style={{ fontSize: '16px' }}
          autoFocus
        />
      ) : (
        <span
          onClick={() => !task.completed && setIsEditing(true)}
          className={`flex-1 cursor-pointer ${
            task.completed ? 'line-through text-textSecondary' : 'text-textPrimary'
          }`}
          style={{ fontSize: '16px' }}
        >
          {task.text}
        </span>
      )}

      {/* Delete Button */}
      <button
        onClick={() => onDelete(task.id)}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
        style={{ minWidth: '32px', minHeight: '32px' }}
        aria-label="Delete task"
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
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}

export default TaskItem;
