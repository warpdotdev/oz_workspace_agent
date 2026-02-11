'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Bot,
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Save,
  Clock,
  AlertCircle,
  Code,
  FileSearch,
  BarChart3,
  Sparkles,
  ListTodo,
  MessageSquare,
  Settings,
  Activity,
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  systemPrompt: string | null
  tools: string[]
  config: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  tasks?: Array<{
    id: string
    title: string
    status: string
    priority: string
    createdAt: string
  }>
  conversations?: Array<{
    id: string
    title: string | null
    status: string
    createdAt: string
  }>
}

const agentTypeIcons: Record<string, React.ReactNode> = {
  CODING: <Code className="h-5 w-5" />,
  RESEARCH: <FileSearch className="h-5 w-5" />,
  ANALYSIS: <BarChart3 className="h-5 w-5" />,
  GENERAL: <Bot className="h-5 w-5" />,
  CUSTOM: <Sparkles className="h-5 w-5" />,
}

const availableTools = [
  { id: 'web_search', name: 'Web Search', description: 'Search the internet for information' },
  { id: 'code_execution', name: 'Code Execution', description: 'Execute code in a sandbox' },
  { id: 'file_operations', name: 'File Operations', description: 'Read, write, and manage files' },
  { id: 'api_calls', name: 'API Calls', description: 'Make HTTP requests to external APIs' },
  { id: 'database', name: 'Database', description: 'Query and modify database records' },
  { id: 'email', name: 'Email', description: 'Send and read emails' },
]

export default function AgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'tasks' | 'activity'>('overview')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    systemPrompt: '',
    tools: [] as string[],
  })

  useEffect(() => {
    fetchAgent()
  }, [agentId])

  async function fetchAgent() {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (response.ok) {
        const data = await response.json()
        setAgent(data.agent)
        setFormData({
          name: data.agent.name,
          description: data.agent.description || '',
          type: data.agent.type,
          systemPrompt: data.agent.systemPrompt || '',
          tools: data.agent.tools || [],
        })
      } else if (response.status === 404) {
        router.push('/agents')
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        const data = await response.json()
        setAgent(data.agent)
      }
    } catch (error) {
      console.error('Failed to update agent:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus() {
    if (!agent) return
    const newStatus = agent.status === 'RUNNING' ? 'PAUSED' : 'RUNNING'
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        setAgent({ ...agent, status: newStatus })
      }
    } catch (error) {
      console.error('Failed to update agent status:', error)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) return
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        router.push('/agents')
      }
    } catch (error) {
      console.error('Failed to delete agent:', error)
    }
  }

  function toggleTool(toolId: string) {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter((t) => t !== toolId)
        : [...prev.tools, toolId],
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'IDLE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Play className="h-3 w-3" />
      case 'IDLE':
        return <Clock className="h-3 w-3" />
      case 'ERROR':
        return <AlertCircle className="h-3 w-3" />
      case 'PAUSED':
        return <Pause className="h-3 w-3" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Agent not found</h2>
        <p className="text-muted-foreground mb-4">The agent you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/agents">Back to Agents</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {agentTypeIcons[agent.type] || <Bot className="h-6 w-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{agent.type}</span>
                <Badge className={getStatusColor(agent.status)}>
                  {getStatusIcon(agent.status)}
                  <span className="ml-1">{agent.status}</span>
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToggleStatus}>
            {agent.status === 'RUNNING' ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'overview', label: 'Overview', icon: Bot },
          { id: 'config', label: 'Configuration', icon: Settings },
          { id: 'tasks', label: 'Tasks', icon: ListTodo },
          { id: 'activity', label: 'Activity', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your agent's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CODING">Coding</SelectItem>
                    <SelectItem value="RESEARCH">Research</SelectItem>
                    <SelectItem value="ANALYSIS">Analysis</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Agent performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Tasks</span>
                  <span className="font-medium">{agent.tasks?.length || 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Conversations</span>
                  <span className="font-medium">{agent.conversations?.length || 0}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {new Date(agent.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Define the agent's behavior and personality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                rows={8}
                placeholder="You are a helpful AI assistant..."
                className="font-mono text-sm"
              />
              <Button onClick={handleSave} disabled={saving} className="mt-4">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Tools</CardTitle>
              <CardDescription>
                Select which tools this agent can use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => toggleTool(tool.id)}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      formData.tools.includes(tool.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded border ${
                          formData.tools.includes(tool.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {formData.tools.includes(tool.id) && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className="text-primary-foreground"
                          >
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                        )}
                      </div>
                      <span className="font-medium">{tool.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                ))}
              </div>
              <Button onClick={handleSave} disabled={saving} className="mt-4">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'tasks' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>Tasks assigned to this agent</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/tasks">View All Tasks</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!agent.tasks || agent.tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No tasks assigned to this agent</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agent.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{task.priority}</Badge>
                      <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Agent execution history and logs</CardDescription>
          </CardHeader>
          <CardContent>
            {!agent.conversations || agent.conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agent.conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{conv.title || 'Untitled Conversation'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline">{conv.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
