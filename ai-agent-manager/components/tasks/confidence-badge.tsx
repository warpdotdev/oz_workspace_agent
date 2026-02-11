import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ConfidenceBadgeProps {
  confidence: number | null | undefined
  showBar?: boolean
  size?: 'sm' | 'md'
}

function getConfidenceConfig(confidence: number) {
  if (confidence >= 80) {
    return {
      label: 'High',
      className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
      barColor: 'bg-green-500',
    }
  }
  if (confidence >= 60) {
    return {
      label: 'Medium',
      className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
      barColor: 'bg-amber-500',
    }
  }
  return {
    label: 'Low',
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
    barColor: 'bg-red-500',
  }
}

export function ConfidenceBadge({ confidence, showBar = true, size = 'sm' }: ConfidenceBadgeProps) {
  if (confidence === null || confidence === undefined) {
    return null
  }

  const config = getConfidenceConfig(confidence)
  const displayValue = Math.round(confidence)

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1',
        'flex items-center gap-1.5'
      )}
    >
      <span>{displayValue}%</span>
      {showBar && (
        <div className="w-8 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', config.barColor)}
            style={{ width: `${displayValue}%` }}
          />
        </div>
      )}
    </Badge>
  )
}

export function ReviewRequiredBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 text-xs"
    >
      Review Required
    </Badge>
  )
}
