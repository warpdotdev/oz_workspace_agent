'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Bot, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  MessageSquare, 
  ListTodo,
  Settings,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { AgentType, AgentStatus } from '@/lib/validations/agent'

interface Agent {
  id: string
  name: string
  description: string | null
  type: AgentType
  status: AgentStatus
  systemPrompt: string | null
  tools: string[]
  config: {
    provider?: string
    model?: string
    temperature?: number
    maxTokens?: number
  } | null
  createdAt: string
  updatedAt: string
  userId: string
  projectId: string | null
  project?: {
    id: string
    name: string
    status: string
  } | null
  _count?: {
    conversations: number
    tasks: number
  }
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

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const response = await fetch(`/api/agents/${id}`)
        if (!response.ok) throw new Error('Failed to fetch agent')
        const data = await response.json()
        setAgent(data)
      } catch (error) {
        toast.error('Failed to load agent')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAgent()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) return
    
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete agent')
      toast.success('Agent deleted successfully')
      router.push('/agents')
    } catch (error) {
      toast.error('Failed to delete agent')
      console.error(error)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Agent not found</h2>
          <p className="text-muted-foreground mb-6">
            The agent you are looking for does not exist or has been deleted.
          </p>
          <Button asChild>
            <Link href="/agents">Back to Agents</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{typeLabels[agent.type]}</Badge>
              <Badge className={statusColors[agent.status]}>
                {agent.status.toLowerCase()}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/agents/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {agent.description && (
          <p className="text-muted-foreground text-lg">{agent.description}</p>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="outline">{typeLabels[agent.type]}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={statusColors[agent.status]}>
                  {agent.status.toLowerCase()}
                </Badge>
              </div>
              {agent.project && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Project</span>
                  <Link 
                    href={`/projects/${agent.project.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {agent.project.name}
                  </Link>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </span>
                <span className="text-sm">{new Date(agent.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Updated
                </span>
                <span className="text-sm">{new Date(agent.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Conversations
                </span>
                <span className="text-2xl font-bold">{agent._count?.conversations ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Tasks
                </span>
                <span className="text-2xl font-bold">{agent._count?.tasks ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {agent.systemPrompt && (
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>Custom instructions for this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                {agent.systemPrompt}
              </pre>
            </CardContent>
          </Card>
        )}

        {agent.config && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>Model and performance parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {agent.config.provider && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Provider</span>
                  <span className="text-sm font-medium capitalize">{agent.config.provider}</span>
                </div>
              )}
              {agent.config.model && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <span className="text-sm font-mono">{agent.config.model}</span>
                </div>
              )}
              {agent.config.temperature !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Temperature</span>
                  <span className="text-sm font-medium">{agent.config.temperature}</span>
                </div>
              )}
              {agent.config.maxTokens && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Max Tokens</span>
                  <span className="text-sm font-medium">{agent.config.maxTokens.toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {agent.tools && agent.tools.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tools</CardTitle>
              <CardDescription>Available capabilities for this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {agent.tools.map((tool) => (
                  <Badge key={tool} variant="outline">
                    {tool}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
