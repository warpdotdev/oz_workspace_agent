'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './kanban-column'
import { TaskCard } from './task-card'
import { Task, TaskStatus, KANBAN_COLUMNS } from '@/types/task'

interface KanbanBoardProps {
  tasks: Task[]
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void
  onAddTask?: (status: TaskStatus) => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (taskId: string) => void
  isLoading?: boolean
}

export function KanbanBoard({
  tasks,
  onTaskMove,
  onAddTask,
  onEditTask,
  onDeleteTask,
  isLoading,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)

  // Update local tasks when props change
  useState(() => {
    setLocalTasks(tasks)
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Group tasks by status
  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return localTasks.filter((task) => task.status === status)
    },
    [localTasks]
  )

  const findTaskById = useCallback(
    (id: string) => {
      return localTasks.find((task) => task.id === id)
    },
    [localTasks]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = findTaskById(active.id as string)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = findTaskById(activeId)
    if (!activeTask) return

    // Check if over is a column or a task
    const isOverColumn = KANBAN_COLUMNS.some((col) => col.id === overId)
    const overTask = findTaskById(overId)

    let newStatus: TaskStatus

    if (isOverColumn) {
      newStatus = overId as TaskStatus
    } else if (overTask) {
      newStatus = overTask.status
    } else {
      return
    }

    // Only update if status changed
    if (activeTask.status !== newStatus) {
      setLocalTasks((prev) =>
        prev.map((task) =>
          task.id === activeId ? { ...task, status: newStatus } : task
        )
      )
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = findTaskById(activeId)
    if (!activeTask) return

    // Determine the final status
    const isOverColumn = KANBAN_COLUMNS.some((col) => col.id === overId)
    const overTask = findTaskById(overId)

    let finalStatus: TaskStatus

    if (isOverColumn) {
      finalStatus = overId as TaskStatus
    } else if (overTask) {
      finalStatus = overTask.status
    } else {
      return
    }

    // Call the onTaskMove callback if status changed
    if (activeTask.status !== finalStatus || localTasks.find(t => t.id === activeId)?.status !== finalStatus) {
      onTaskMove?.(activeId, finalStatus)
    }

    // Reorder within the same column if needed
    if (overTask && activeTask.status === overTask.status) {
      const columnTasks = getTasksByStatus(activeTask.status)
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId)
      const newIndex = columnTasks.findIndex((t) => t.id === overId)

      if (oldIndex !== newIndex) {
        const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex)
        setLocalTasks((prev) => {
          const otherTasks = prev.filter((t) => t.status !== activeTask.status)
          return [...otherTasks, ...reorderedTasks]
        })
      }
    }
  }

  // Sync local state with props when tasks prop changes
  if (JSON.stringify(tasks) !== JSON.stringify(localTasks) && !activeTask) {
    setLocalTasks(tasks)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] min-h-[500px]">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            tasks={getTasksByStatus(column.id)}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
