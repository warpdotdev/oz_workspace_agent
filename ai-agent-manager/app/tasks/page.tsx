'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Task, TaskStatus, CreateTaskInput, TaskPriority } from '@/types/task'
import { KanbanColumn } from '@/components/tasks/kanban-column'
import { TaskModal } from '@/components/tasks/task-modal'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskFilters, CardDensity } from '@/components/tasks/task-filters'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskEvents } from '@/hooks/use-task-events'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL')
  const [agentFilter, setAgentFilter] = useState<string | 'ALL'>('ALL')
  const [density, setDensity] = useState<CardDensity>('comfortable')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Real-time task event handlers
  const handleTaskCreatedEvent = useCallback((task: Task) => {
    setTasks((prev) => {
      // Avoid duplicates (in case optimistic update already added it)
      if (prev.some((t) => t.id === task.id)) {
        return prev.map((t) => (t.id === task.id ? task : t))
      }
      return [...prev, task]
    })
  }, [])

  const handleTaskUpdatedEvent = useCallback((task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
  }, [])

  const handleTaskDeletedEvent = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [])

  // SSE connection for real-time updates
  const { isConnected, reconnect } = useTaskEvents({
    onTaskCreated: handleTaskCreatedEvent,
    onTaskUpdated: handleTaskUpdatedEvent,
    onTaskDeleted: handleTaskDeletedEvent,
  })

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch('/api/tasks')
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      setTasks(data.tasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents?.map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })) || [])
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchAgents()
    // No longer need polling - real-time updates via SSE
  }, [fetchTasks, fetchAgents])

  const handleCreateTask = async (taskData: CreateTaskInput) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      const { task } = await response.json()
      setTasks((prev) => [...prev, task])
      toast.success('Task created successfully')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create task')
      throw error
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }

      const { task } = await response.json()
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)))
      return task
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update task')
      throw error
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )

    try {
      await handleUpdateTask(taskId, { status: newStatus })
      toast.success(`Task moved to ${newStatus.replace('_', ' ').toLowerCase()}`)
    } catch {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      )
    }
  }

  const handleTaskClick = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleModalSave = async (taskData: CreateTaskInput) => {
    if (editingTask) {
      await handleUpdateTask(editingTask.id, taskData)
      toast.success('Task updated successfully')
    } else {
      await handleCreateTask(taskData)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingTask(undefined)
  }

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(query)
        const matchesDescription = task.description?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesDescription) return false
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
        return false
      }

      // Agent filter
      if (agentFilter !== 'ALL') {
        if (agentFilter === 'UNASSIGNED') {
          if (task.agentId) return false
        } else {
          if (task.agentId !== agentFilter) return false
        }
      }

      return true
    })
  }, [tasks, searchQuery, priorityFilter, agentFilter])

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks.filter((task) => task.status === status)
  }

  const columns: Array<{ status: TaskStatus; title: string }> = [
    { status: 'TODO', title: 'To Do' },
    { status: 'IN_PROGRESS', title: 'In Progress' },
    { status: 'REVIEW', title: 'Review' },
    { status: 'DONE', title: 'Done' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Task Board</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Manage your tasks with drag-and-drop
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={isConnected ? 'default' : 'secondary'}
              className={`flex items-center gap-1 ${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}
              title={isConnected ? 'Real-time updates active' : 'Reconnecting...'}
            >
              {isConnected ? (
                <><Wifi className="h-3 w-3" /> Live</>
              ) : (
                <><WifiOff className="h-3 w-3" /> Offline</>
              )}
            </Badge>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  fetchTasks()
                  if (!isConnected) reconnect()
                }}
                title="Refresh & reconnect"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>
        </div>

        <TaskFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          agentFilter={agentFilter}
          onAgentChange={setAgentFilter}
          agents={agents}
          density={density}
          onDensityChange={setDensity}
        />

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            {columns.map((column) => (
              <KanbanColumn
                key={column.status}
                status={column.status}
                title={column.title}
                tasks={getTasksByStatus(column.status)}
                onTaskClick={handleTaskClick}
                density={density}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} density={density} /> : null}
          </DragOverlay>
        </DndContext>

        <TaskModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          task={editingTask}
          agents={agents}
        />
      </div>
    </div>
  )
}
