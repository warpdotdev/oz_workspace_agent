import { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, FilterType, CreateTaskInput, UpdateTaskInput } from './types/Task';
import { taskApi } from './services/api';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { FilterTabs } from './components/FilterTabs';
import './App.css';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await taskApi.getAll();
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = useCallback(async (input: CreateTaskInput) => {
    try {
      setError(null);
      const newTask = await taskApi.create(input);
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      setError('Failed to create task. Please try again.');
      console.error('Error creating task:', err);
      throw err;
    }
  }, []);

  const handleUpdate = useCallback(async (id: string, input: UpdateTaskInput) => {
    try {
      setError(null);
      const updatedTask = await taskApi.update(id, input);
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? updatedTask : task))
      );
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error('Error updating task:', err);
      throw err;
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      setError(null);
      await taskApi.delete(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error('Error deleting task:', err);
      throw err;
    }
  }, []);

  const handleToggle = useCallback(async (id: string, completed: boolean) => {
    try {
      setError(null);
      const updatedTask = await taskApi.toggleComplete(id, completed);
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? updatedTask : task))
      );
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error('Error toggling task:', err);
      throw err;
    }
  }, []);

  // Filter tasks based on current filter
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return tasks.filter((task) => !task.completed);
      case 'completed':
        return tasks.filter((task) => task.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  // Calculate task counts for filter tabs
  const taskCounts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
  }), [tasks]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>To-Do List</h1>
      </header>

      <main className="app-main">
        <TaskForm onSubmit={handleCreate} />

        {error && (
          <div className="error-message">
            {error}
            <button className="error-dismiss" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        <FilterTabs
          currentFilter={filter}
          onFilterChange={setFilter}
          taskCounts={taskCounts}
        />

        {isLoading ? (
          <div className="loading">Loading tasks...</div>
        ) : (
          <TaskList
            tasks={filteredTasks}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          {taskCounts.active} item{taskCounts.active !== 1 ? 's' : ''} left
        </p>
      </footer>
    </div>
  );
}

export default App;
