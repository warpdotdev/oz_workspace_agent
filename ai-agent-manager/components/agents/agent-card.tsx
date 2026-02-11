'use client'

import Link from 'next/link'
import { Bot, MoreVertical, Play, Pause, Trash2, Edit, MessageSquare, ListTodo } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AgentType, AgentStatus } from '@/lib/validations/agent'

interface AgentCardProps {
  agent: {
    id: string
    name: string
    description: string | null
    type: AgentType
    status: AgentStatus
    createdAt: string
    updatedAt: string
    project?: {
      id: string
      name: string
    } | null
    _count?: {
      conversations: number
      tasks: number
    }
  }
  onDelete?: (id: string) => void
}

const statusColors: Record<AgentStatus, string> = {
  IDLE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  RUNNING: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  TERMINATED: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

const typeLabels: Record<AgentType, string> = {
  CODING: 'Coding',
  RESEARCH: 'Research',
  ANALYSIS: 'Analysis',
  GENERAL: 'General',
  CUSTOM: 'Custom',
}

export function AgentCard({ agent, onDelete }: AgentCardProps) {
  const handleDelete = () => {
    if (onDelete) {
      onDelete(agent.id)
    }
  }

  return (
    <Card className="relative group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                <Link 
                  href={`/agents/${agent.id}`}
                  className="hover:underline"
                >
                  {agent.name}
                </Link>
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {typeLabels[agent.type]}
                </Badge>
                <Badge className={`${statusColors[agent.status]} text-xs`}>
                  {agent.status.toLowerCase()}
                </Badge>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/agents/${agent.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                {agent.status === 'RUNNING' ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {agent.description && (
          <CardDescription className="line-clamp-2 mb-4">
            {agent.description}
          </CardDescription>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {agent._count && (
            <>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{agent._count.conversations} conversations</span>
              </div>
              <div className="flex items-center gap-1">
                <ListTodo className="h-4 w-4" />
                <span>{agent._count.tasks} tasks</span>
              </div>
            </>
          )}
        </div>
        {agent.project && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Project: <span className="font-medium">{agent.project.name}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
