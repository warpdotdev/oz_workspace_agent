import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  Code,
  Search,
  BarChart3,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Square,
  Trash2,
  Clock,
  ListTodo,
} from 'lucide-react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AgentStatusBadge } from '@/components/agents/agent-status-badge'
import type { AgentType, AgentStatus } from '@/lib/validations/agent'

const typeIcons: Record<AgentType, React.ElementType> = {
  CODING: Code,
  RESEARCH: Search,
  ANALYSIS: BarChart3,
  GENERAL: MessageSquare,
  CUSTOM: Settings,
}

const typeLabels: Record<AgentType, string> = {
  CODING: 'Coding Assistant',
  RESEARCH: 'Research Agent',
  ANALYSIS: 'Data Analyst',
  GENERAL: 'General Assistant',
  CUSTOM: 'Custom Agent',
}

async function getAgent(id: string, userId: string) {
  return db.agent.findFirst({
    where: { id, userId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      tasks: {
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          updatedAt: true,
        },
      },
      conversations: {
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
        },
      },
      _count: {
        select: {
          tasks: true,
          conversations: true,
          auditLogs: true,
        },
      },
    },
  })
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AgentDetailPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { id } = await params
  const agent = await getAgent(id, session.user.id)

  if (!agent) {
    notFound()
  }

  const Icon = typeIcons[agent.type as AgentType]
  const config = (agent.config as Record<string, any>) || {}

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-100 text-blue-600',
    HIGH: 'bg-amber-100 text-amber-600',
    URGENT: 'bg-red-100 text-red-600',
  }

  const statusColors: Record<string, string> = {
    TODO: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-600',
    REVIEW: 'bg-amber-100 text-amber-600',
    DONE: 'bg-green-100 text-green-600',
    CANCELLED: 'bg-red-100 text-red-600',
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/agents">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {agent.name}
                  </h1>
                  <AgentStatusBadge status={agent.status as AgentStatus} />
                </div>
                <p className="text-muted-foreground">
                  {typeLabels[agent.type as AgentType]}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(agent.status === 'IDLE' || agent.status === 'PAUSED') && (
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            )}
            {agent.status === 'RUNNING' && (
              <>
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button variant="outline" size="sm">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            {agent.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* System Prompt */}
            {agent.systemPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">System Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                    {agent.systemPrompt}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Tools */}
            {agent.tools && agent.tools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {agent.tools.map((tool) => (
                      <Badge key={tool} variant="secondary">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recent Tasks</CardTitle>
                  <Link
                    href={`/tasks?agentId=${agent.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View all ({agent._count.tasks})
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {agent.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {agent.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <ListTodo className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={priorityColors[task.priority]}
                            variant="secondary"
                          >
                            {task.priority.toLowerCase()}
                          </Badge>
                          <Badge
                            className={statusColors[task.status]}
                            variant="secondary"
                          >
                            {task.status.replace('_', ' ').toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No tasks assigned to this agent yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasks</span>
                  <span className="font-medium">{agent._count.tasks}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Conversations
                  </span>
                  <span className="font-medium">
                    {agent._count.conversations}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Audit Logs
                  </span>
                  <span className="font-medium">{agent._count.auditLogs}</span>
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.maxTokens && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Max Tokens
                      </span>
                      <span className="font-medium">{config.maxTokens}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {config.temperature !== undefined && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Temperature
                      </span>
                      <span className="font-medium">{config.temperature}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {config.confidenceThreshold !== undefined && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Confidence
                      </span>
                      <span className="font-medium">
                        {config.confidenceThreshold}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                {config.retryAttempts !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Retry Attempts
                    </span>
                    <span className="font-medium">{config.retryAttempts}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created</span>
                  <span className="ml-auto">
                    {formatDate(agent.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated</span>
                  <span className="ml-auto">
                    {formatDate(agent.updatedAt)}
                  </span>
                </div>
                {agent.project && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Project</span>
                    <Link
                      href={`/projects/${agent.project.id}`}
                      className="ml-auto text-primary hover:underline"
                    >
                      {agent.project.name}
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
