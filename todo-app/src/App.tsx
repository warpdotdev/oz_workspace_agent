import { useCallback, useMemo } from 'react';
import type { Task } from './types/task';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AddTaskForm } from './components/AddTaskForm';
import { TaskList } from './components/TaskList';
import { EmptyState } from './components/EmptyState';
import styles from './App.module.css';

function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('todo-tasks', []);

  const addTask = useCallback((title: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
  }, [setTasks]);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, [setTasks]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, [setTasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    return { total, done };
  }, [tasks]);

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
          ) : (
            <TaskList
              tasks={tasks}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          )}
        </div>

        {tasks.length > 0 && (
          <footer className={styles.footer}>
            {stats.total} task{stats.total !== 1 ? 's' : ''} • {stats.done} done
          </footer>
        )}
      </main>
    </div>
  );
}

export default App;
