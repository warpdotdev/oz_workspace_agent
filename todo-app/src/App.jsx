import { useState, useEffect } from 'react';
import './App.css';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import FilterTabs from './components/FilterTabs';
import Toast from './components/Toast';
import EmptyState from './components/EmptyState';

function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (text) => {
    const newTask = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const editTask = (id, newText) => {
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, text: newText } : task))
    );
  };

  const deleteTask = (id) => {
    const taskToDelete = tasks.find((task) => task.id === id);
    setTasks(tasks.filter((task) => task.id !== id));
    showToast('Task deleted', () => {
      setTasks((prevTasks) => {
        const index = prevTasks.findIndex((t) => t.id > id);
        if (index === -1) return [...prevTasks, taskToDelete];
        return [
          ...prevTasks.slice(0, index),
          taskToDelete,
          ...prevTasks.slice(index),
        ];
      });
    });
  };

  const showToast = (message, onUndo) => {
    setToast({ message, onUndo });
    setTimeout(() => setToast(null), 5000);
  };

  const getFilteredTasks = () => {
    switch (filter) {
      case 'active':
        return tasks.filter((task) => !task.completed);
      case 'completed':
        return tasks.filter((task) => task.completed);
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();
  const activeCount = tasks.filter((task) => !task.completed).length;

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-semibold text-textPrimary mb-2">
            Simple Tasks
          </h1>
          <p className="text-textSecondary">Do more. Manage less.</p>
        </header>

        {/* Main Card */}
        <div className="bg-bgCard rounded-xl shadow-sm p-6">
          {/* Task Input */}
          <TaskInput onAddTask={addTask} />

          {/* Task List or Empty State */}
          {tasks.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <TaskList
                tasks={filteredTasks}
                onToggle={toggleTask}
                onEdit={editTask}
                onDelete={deleteTask}
              />

              {/* Filter Tabs and Count */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <FilterTabs filter={filter} setFilter={setFilter} />
                  <p className="text-sm text-textSecondary">
                    {activeCount} {activeCount === 1 ? 'task' : 'tasks'} left
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-textSecondary">
          <p>Simple. Focused. Just for you.</p>
        </footer>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          onUndo={toast.onUndo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
