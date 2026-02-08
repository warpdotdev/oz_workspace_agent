import { useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AddTaskForm } from './components/AddTaskForm';
import { TaskList } from './components/TaskList';
import type { Task } from './types/task';

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

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center justify-center gap-2">
            <span className="text-emerald-500">✓</span>
            my tasks
          </h1>
        </header>

        {/* Add Task Form */}
        <div className="mb-6">
          <AddTaskForm onAdd={addTask} />
        </div>

        {/* Task List */}
        <TaskList
          tasks={tasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />

        {/* Footer with counts */}
        {totalCount > 0 && (
          <footer className="text-center mt-6 text-sm text-gray-500">
            {totalCount} {totalCount === 1 ? 'task' : 'tasks'} • {completedCount} done
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
