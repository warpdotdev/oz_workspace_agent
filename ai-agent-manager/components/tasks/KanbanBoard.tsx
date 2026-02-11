'use client'

import { useState, useMemo } from 'react'
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
import { Task, TaskStatus, KANBAN_COLUMNS } from '@/types/task'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'

interface KanbanBoardProps {
  tasks: Task[]
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void
  onAddTask: (status: TaskStatus) => void
  onTaskClick: (task: Task) => void
}

export function KanbanBoard({ tasks, onTaskMove, onAddTask, onTaskClick }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

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
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
      CANCELLED: [],
    }
    
    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })
    
    return grouped
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find((t) => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over if needed for real-time visual feedback
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the task being dragged
    const draggedTask = tasks.find((t) => t.id === activeId)
    if (!draggedTask) return

    // Check if dropped over a column (status)
    const isOverColumn = KANBAN_COLUMNS.some((col) => col.id === overId)
    
    if (isOverColumn) {
      // Dropped directly on a column
      const newStatus = overId as TaskStatus
      if (draggedTask.status !== newStatus) {
        onTaskMove(activeId, newStatus)
      }
    } else {
      // Dropped on another task - find which column that task is in
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask && draggedTask.status !== overTask.status) {
        onTaskMove(activeId, overTask.status)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.filter((col) => col.id !== 'CANCELLED').map((column) => (
          <KanbanColumn
            key={column.id}
            status={column.id}
            tasks={tasksByStatus[column.id] || []}
            onAddTask={onAddTask}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      {/* Drag overlay for smooth dragging */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 scale-105">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
