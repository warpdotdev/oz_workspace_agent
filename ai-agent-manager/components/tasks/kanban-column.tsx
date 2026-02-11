import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Task, TaskStatus } from '@/types/task'
import { TaskCard } from './task-card'
import { Badge } from '@/components/ui/badge'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CardDensity } from './task-filters'
import { Inbox, PlayCircle, Eye, CheckCircle } from 'lucide-react'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  title: string
  onTaskClick?: (task: Task) => void
  density?: CardDensity
}

interface SortableTaskCardProps {
  task: Task
  onClick?: () => void
  density?: CardDensity
}

function SortableTaskCard({ task, onClick, density }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} density={density} />
    </div>
  )
}

const statusColors = {
  TODO: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  REVIEW: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
  DONE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
}

const emptyStateContent = {
  TODO: {
    icon: Inbox,
    title: 'No tasks yet',
    description: 'Create a new task to get started',
  },
  IN_PROGRESS: {
    icon: PlayCircle,
    title: 'Nothing in progress',
    description: 'Drag a task here to start working on it',
  },
  REVIEW: {
    icon: Eye,
    title: 'Nothing to review',
    description: 'Tasks that need review will appear here',
  },
  DONE: {
    icon: CheckCircle,
    title: 'No completed tasks',
    description: 'Completed tasks will show up here',
  },
  CANCELLED: {
    icon: Inbox,
    title: 'No cancelled tasks',
    description: 'Cancelled tasks will appear here',
  },
}

export function KanbanColumn({ status, tasks, title, onTaskClick, density = 'comfortable' }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const taskIds = tasks.map((task) => task.id)
  const emptyState = emptyStateContent[status]
  const EmptyIcon = emptyState.icon

  const spacingClass = {
    compact: 'space-y-1',
    comfortable: 'space-y-3',
    spacious: 'space-y-4',
  }[density]

  return (
    <div className="flex flex-col h-full min-w-[320px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">{title}</h2>
          <Badge variant="outline" className={statusColors[status]}>
            {tasks.length}
          </Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 ${spacingClass} p-2 rounded-lg min-h-[200px] transition-colors ${
          isOver ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-zinc-50 dark:bg-zinc-900/50'
        }`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <EmptyIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {emptyState.title}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                {emptyState.description}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
                density={density}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
