import { useState } from 'react';
import type { Todo } from 'shared';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, title: string) => void;
}

function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== todo.title) {
      onUpdate(todo.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <li className="todo-item editing">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="edit-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </form>
      </li>
    );
  }

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="toggle"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span className="title" onDoubleClick={() => setIsEditing(true)}>
        {todo.title}
      </span>
      <button className="delete-btn" onClick={() => onDelete(todo.id)}>
        ×
      </button>
    </li>
  );
}

export default TodoItem;
