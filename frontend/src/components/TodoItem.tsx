import { useState } from 'react';
import type { Todo } from '@shared/types/todo';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onUpdate: (id: number, title: string) => void;
  onDelete: (id: number) => void;
}

export function TodoItem({ todo, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== todo.title) {
      onUpdate(todo.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="todo-checkbox"
      />
      {isEditing ? (
        <div className="todo-edit">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="todo-edit-input"
            autoFocus
          />
          <button onClick={handleSave} className="todo-save-button">
            Save
          </button>
          <button onClick={handleCancel} className="todo-cancel-button">
            Cancel
          </button>
        </div>
      ) : (
        <>
          <span
            className="todo-title"
            onDoubleClick={() => setIsEditing(true)}
          >
            {todo.title}
          </span>
          <button
            onClick={() => onDelete(todo.id)}
            className="todo-delete-button"
          >
            Delete
          </button>
        </>
      )}
    </li>
  );
}
