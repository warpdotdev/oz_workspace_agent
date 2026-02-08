import { useState } from 'react';
import type { FormEvent } from 'react';
import styles from './AddTaskForm.module.css';

interface AddTaskFormProps {
  onAddTask: (title: string) => void;
}

export function AddTaskForm({ onAddTask }: AddTaskFormProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      onAddTask(trimmedTitle);
      setTitle('');
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <span className={styles.plusIcon}>+</span>
      <input
        type="text"
        className={styles.input}
        placeholder="Add a new task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />
    </form>
  );
}
