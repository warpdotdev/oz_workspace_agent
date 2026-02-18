import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks')
    return saved ? JSON.parse(saved) : []
  })
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [undoStack, setUndoStack] = useState([])
  const [showUndo, setShowUndo] = useState(false)

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [undoStack])

  const addTask = (e) => {
    e.preventDefault()
    if (inputValue.trim() === '') return
    
    const newTask = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    }
    
    setTasks([...tasks, newTask])
    setInputValue('')
  }

  const toggleTask = (id) => {
    const taskToUpdate = tasks.find(t => t.id === id)
    setUndoStack([...undoStack, { action: 'toggle', task: taskToUpdate }])
    
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id) => {
    const taskToDelete = tasks.find(t => t.id === id)
    setUndoStack([...undoStack, { action: 'delete', task: taskToDelete }])
    setShowUndo(true)
    setTimeout(() => setShowUndo(false), 3000)
    
    setTasks(tasks.filter(task => task.id !== id))
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    
    const lastAction = undoStack[undoStack.length - 1]
    
    if (lastAction.action === 'delete') {
      setTasks([...tasks, lastAction.task])
    } else if (lastAction.action === 'toggle') {
      setTasks(tasks.map(task =>
        task.id === lastAction.task.id ? lastAction.task : task
      ))
    }
    
    setUndoStack(undoStack.slice(0, -1))
    setShowUndo(false)
  }

  const startEdit = (id, text) => {
    setEditingId(id)
    setEditValue(text)
  }

  const saveEdit = (id) => {
    if (editValue.trim() === '') {
      deleteTask(id)
    } else {
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, text: editValue.trim() } : task
      ))
    }
    setEditingId(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const getFilteredTasks = () => {
    if (filter === 'active') return tasks.filter(t => !t.completed)
    if (filter === 'completed') return tasks.filter(t => t.completed)
    return tasks
  }

  const filteredTasks = getFilteredTasks()
  const activeCount = tasks.filter(t => !t.completed).length
  const allCompleted = tasks.length > 0 && activeCount === 0

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Do more. Manage less.</h1>
          <p className="subtitle">A simple to-do app that gets out of your way</p>
        </header>

        <div className="main-card">
          <form onSubmit={addTask} className="add-task-form">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What needs to be done?"
              className="task-input"
              autoFocus
            />
            <button type="submit" className="add-button">
              Add Task
            </button>
          </form>

          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✨</div>
              <h3>Your slate is clean!</h3>
              <p>Add your first task above to get started.</p>
            </div>
          ) : allCompleted ? (
            <div className="celebration-state">
              <div className="celebration-icon">🎉</div>
              <h3>All done!</h3>
              <p>You've completed all your tasks. Take a moment to celebrate!</p>
            </div>
          ) : null}

          {filteredTasks.length > 0 && (
            <ul className="task-list">
              {filteredTasks.map(task => (
                <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <div className="task-content">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="checkbox"
                      />
                      <span className="checkmark"></span>
                    </label>
                    
                    {editingId === task.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(task.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="edit-input"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="task-text"
                        onClick={() => startEdit(task.id, task.text)}
                      >
                        {task.text}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="delete-button"
                    aria-label="Delete task"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}

          {tasks.length > 0 && (
            <div className="footer">
              <div className="task-count">
                {activeCount} {activeCount === 1 ? 'task' : 'tasks'} remaining
              </div>
              
              <div className="filters">
                <button
                  className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`filter-button ${filter === 'active' ? 'active' : ''}`}
                  onClick={() => setFilter('active')}
                >
                  Active
                </button>
                <button
                  className={`filter-button ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </button>
              </div>
            </div>
          )}
        </div>

        {showUndo && (
          <div className="undo-toast">
            <span>Task deleted</span>
            <button onClick={handleUndo} className="undo-button">
              Undo
            </button>
          </div>
        )}

        <div className="keyboard-shortcuts">
          <p>💡 Pro tip: Press Ctrl+Z to undo</p>
        </div>
      </div>
    </div>
  )
}

export default App
