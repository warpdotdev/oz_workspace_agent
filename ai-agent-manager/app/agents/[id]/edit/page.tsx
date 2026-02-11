'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { AgentForm } from '@/components/agents/agent-form'
import { Skeleton } from '@/components/ui/skeleton'

interface AgentData {
  id: string
  name: string
  description?: string
  type: string
  systemPrompt?: string
  tools: string[]
  config?: Record<string, unknown>
  projectId?: string
}

export default function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [agent, setAgent] = useState<AgentData | null>(null)
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
        router.push('/agents')
      } finally {
        setIsLoading(false)
      }
    }
    fetchAgent()
  }, [id, router])

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
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
          <p className="text-muted-foreground mt-2">
            Update the configuration and settings for {agent.name}
          </p>
        </div>
        <AgentForm 
          initialData={{ ...agent, id } as Parameters<typeof AgentForm>[0]['initialData']}
          onSuccess={() => {
            router.push(`/agents/${id}`)
            router.refresh()
          }}
        />
      </div>
    </DashboardLayout>
  )
}
