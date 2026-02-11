'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, RefreshCw, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AgentCard } from '@/components/agents/agent-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { AgentType, AgentStatus } from '@/lib/validations/agent'

interface Agent {
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

interface AgentsResponse {
  agents: Agent[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const agentTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'CODING', label: 'Coding' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'ANALYSIS', label: 'Analysis' },
  { value: 'GENERAL', label: 'General' },
  { value: 'CUSTOM', label: 'Custom' },
]

const agentStatuses = [
  { value: 'all', label: 'All Statuses' },
  { value: 'IDLE', label: 'Idle' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'ERROR', label: 'Error' },
  { value: 'TERMINATED', label: 'Terminated' },
]

export default function AgentsPage() {
  const searchParams = useSearchParams()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [type, setType] = useState(searchParams.get('type') ?? 'all')
  const [status, setStatus] = useState(searchParams.get('status') ?? 'all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  const fetchAgents = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (search) params.set('search', search)
      if (type && type !== 'all') params.set('type', type)
      if (status && status !== 'all') params.set('status', status)

      const response = await fetch(`/api/agents?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }
      const data: AgentsResponse = await response.json()
      setAgents(data.agents)
      setPagination(data.pagination)
    } catch (error) {
      toast.error('Failed to load agents')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [search, type, status, pagination.page, pagination.limit])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return
    
    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete agent')
      toast.success('Agent deleted successfully')
      fetchAgents()
    } catch (error) {
      toast.error('Failed to delete agent')
      console.error(error)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor your AI agents
            </p>
          </div>
          <Button asChild>
            <Link href="/agents/new">
              <Plus className="mr-2 h-4 w-4" />
              New Agent
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              className="pl-9"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={type} onValueChange={(v) => { setType(v); setPagination(prev => ({ ...prev, page: 1 })) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {agentTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPagination(prev => ({ ...prev, page: 1 })) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {agentStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchAgents}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-xl" />
            ))}
          </div>
        ) : agents.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} onDelete={handleDelete} />
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No agents found</h3>
            <p className="text-muted-foreground mb-4">
              {search || type !== 'all' || status !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first agent'}
            </p>
            {!search && type === 'all' && status === 'all' && (
              <Button asChild>
                <Link href="/agents/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Agent
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
