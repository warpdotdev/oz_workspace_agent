import { useCallback, useMemo, useState } from 'react';
import type { Task } from './types/task';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AddTaskForm } from './components/AddTaskForm';
import { TaskList } from './components/TaskList';
import { EmptyState } from './components/EmptyState';
import { TodoFilters, type FilterType } from './components/TodoFilters';
import styles from './App.module.css';

function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('todo-tasks', []);
  const [filter, setFilter] = useState<FilterType>('all');

  const addTask = useCallback((title: string) => {
    const now = Date.now();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [newTask, ...prev]);
  }, [setTasks]);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed, updatedAt: Date.now() }
          : task
      )
    );
  }, [setTasks]);

  const updateTask = useCallback((id: string, title: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, title, updatedAt: Date.now() } : task
      )
    );
  }, [setTasks]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, [setTasks]);

  const itemsLeft = useMemo(() => {
    return tasks.filter((t) => !t.completed).length;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return tasks.filter((t) => !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.checkIcon}>✓</span> my tasks
        </h1>
      </header>

      <main className={styles.main}>
        <AddTaskForm onAddTask={addTask} />
        
        <div className={styles.taskSection}>
          {tasks.length === 0 ? (
            <EmptyState />
          ) : filteredTasks.length === 0 ? (
            <div className={styles.noResults}>
              No {filter} tasks
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
            />
          )}
        </div>

        {tasks.length > 0 && (
          <TodoFilters
            currentFilter={filter}
            onFilterChange={setFilter}
            itemsLeft={itemsLeft}
          />
        )}
      </main>
    </div>
  );
}

export default App;
