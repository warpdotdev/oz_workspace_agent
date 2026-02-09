import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  })
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(tasks))
  }, [tasks])

  const addTask = (e) => {
    e.preventDefault()
    if (newTask.trim() === '') return
    
    const task = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    }
    
    setTasks([...tasks, task])
    setNewTask('')
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const completedCount = tasks.filter(t => t.completed).length
  const totalCount = tasks.length

  return (
    <div className="app">
      <header className="header">
        <h1>To-Do List</h1>
        {totalCount > 0 && (
          <p className="progress">{completedCount} of {totalCount} completed</p>
        )}
      </header>

      <form className="add-form" onSubmit={addTask}>
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="task-input"
          autoFocus
        />
        <button type="submit" className="add-btn">Add</button>
      </form>

      <ul className="task-list">
        {tasks.length === 0 ? (
          <li className="empty-state">No tasks yet. Add one above!</li>
        ) : (
          tasks.map(task => (
            <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <label className="task-label">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="task-checkbox"
                />
                <span className="task-text">{task.text}</span>
              </label>
              <button
                onClick={() => deleteTask(task.id)}
                className="delete-btn"
                aria-label="Delete task"
              >
                ×
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

export default App
