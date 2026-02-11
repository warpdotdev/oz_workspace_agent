'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { KanbanColumn } from './kanban-column'
import { TaskCard } from './task-card'
import { Task, TaskStatus } from '@/types/task'

interface KanbanBoardProps {
  tasks: Task[]
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void
  onTaskClick?: (task: Task) => void
  onAddTask?: (status: TaskStatus) => void
}

const columns: { status: TaskStatus; title: string }[] = [
  { status: 'TODO', title: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'REVIEW', title: 'Review' },
  { status: 'DONE', title: 'Done' },
]

export function KanbanBoard({
  tasks,
  onTaskMove,
  onTaskClick,
  onAddTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveTask(null)
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== newStatus) {
      onTaskMove(taskId, newStatus)
    }

    setActiveTask(null)
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            tasks={getTasksByStatus(column.status)}
            onTaskClick={onTaskClick}
            onAddTask={() => onAddTask?.(column.status)}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <div className="w-80 opacity-80">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
