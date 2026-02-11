'use client'

import Link from 'next/link'
import {
  Code,
  Search,
  BarChart3,
  MessageSquare,
  Settings,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Edit,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AgentStatusBadge } from './agent-status-badge'
import type { AgentType, AgentStatus } from '@/lib/validations/agent'

interface AgentCardProps {
  agent: {
    id: string
    name: string
    description: string | null
    type: AgentType
    status: AgentStatus
    project?: {
      id: string
      name: string
    } | null
    _count?: {
      tasks: number
      conversations: number
    }
    updatedAt: Date | string
  }
  onStart?: (id: string) => void
  onPause?: (id: string) => void
  onDelete?: (id: string) => void
}

const typeIcons: Record<AgentType, React.ElementType> = {
  CODING: Code,
  RESEARCH: Search,
  ANALYSIS: BarChart3,
  GENERAL: MessageSquare,
  CUSTOM: Settings,
}

const typeLabels: Record<AgentType, string> = {
  CODING: 'Coding',
  RESEARCH: 'Research',
  ANALYSIS: 'Analysis',
  GENERAL: 'General',
  CUSTOM: 'Custom',
}

export function AgentCard({ agent, onStart, onPause, onDelete }: AgentCardProps) {
  const Icon = typeIcons[agent.type]
  const canStart = agent.status === 'IDLE' || agent.status === 'PAUSED'
  const canPause = agent.status === 'RUNNING'

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="group relative hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <Link href={`/agents/${agent.id}`}>
                <CardTitle className="text-base hover:underline cursor-pointer">
                  {agent.name}
                </CardTitle>
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {typeLabels[agent.type]}
                </span>
                <AgentStatusBadge status={agent.status} />
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/agents/${agent.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {canStart && (
                <DropdownMenuItem onClick={() => onStart?.(agent.id)}>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </DropdownMenuItem>
              )}
              {canPause && (
                <DropdownMenuItem onClick={() => onPause?.(agent.id)}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(agent.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {agent.description && (
          <CardDescription className="line-clamp-2 mb-3">
            {agent.description}
          </CardDescription>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {agent._count && (
              <>
                <span>{agent._count.tasks} tasks</span>
                <span>{agent._count.conversations} conversations</span>
              </>
            )}
          </div>
          <span>Updated {formatDate(agent.updatedAt)}</span>
        </div>
        {agent.project && (
          <div className="mt-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Project: {agent.project.name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
