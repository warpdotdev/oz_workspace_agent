import { Badge } from '@/components/ui/badge'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface PriorityBadgeProps {
  priority: Priority
}

const priorityConfig = {
  LOW: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  },
  HIGH: {
    label: 'High',
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
  },
  URGENT: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  },
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
