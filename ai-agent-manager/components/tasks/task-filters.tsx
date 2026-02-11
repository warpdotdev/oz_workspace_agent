'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X, LayoutGrid, List, Rows3 } from 'lucide-react'
import { TaskPriority } from '@/types/task'

export type CardDensity = 'compact' | 'comfortable' | 'spacious'

interface TaskFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  priorityFilter: TaskPriority | 'ALL'
  onPriorityChange: (priority: TaskPriority | 'ALL') => void
  agentFilter: string | 'ALL'
  onAgentChange: (agentId: string | 'ALL') => void
  agents: Array<{ id: string; name: string }>
  density: CardDensity
  onDensityChange: (density: CardDensity) => void
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  agentFilter,
  onAgentChange,
  agents,
  density,
  onDensityChange,
}: TaskFiltersProps) {
  const hasFilters = searchQuery || priorityFilter !== 'ALL' || agentFilter !== 'ALL'

  const clearFilters = () => {
    onSearchChange('')
    onPriorityChange('ALL')
    onAgentChange('ALL')
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={priorityFilter} onValueChange={(value) => onPriorityChange(value as TaskPriority | 'ALL')}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Priorities</SelectItem>
          <SelectItem value="URGENT">Urgent</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select value={agentFilter} onValueChange={(value) => onAgentChange(value)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Agents</SelectItem>
          <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-zinc-500">
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}

      <div className="flex-1" />

      <div className="flex items-center border rounded-md">
        <Button
          variant={density === 'compact' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onDensityChange('compact')}
          title="Compact view"
          className="rounded-r-none"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={density === 'comfortable' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onDensityChange('comfortable')}
          title="Comfortable view"
          className="rounded-none border-x"
        >
          <Rows3 className="h-4 w-4" />
        </Button>
        <Button
          variant={density === 'spacious' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onDensityChange('spacious')}
          title="Spacious view"
          className="rounded-l-none"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
