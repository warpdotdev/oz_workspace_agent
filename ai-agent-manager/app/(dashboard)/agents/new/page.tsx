'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import {
  Bot,
  ArrowLeft,
  Code,
  FileSearch,
  BarChart3,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react'

const agentTypes = [
  {
    id: 'CODING',
    name: 'Coding',
    icon: Code,
    description: 'Write, review, and debug code',
    color: 'bg-blue-500',
  },
  {
    id: 'RESEARCH',
    name: 'Research',
    icon: FileSearch,
    description: 'Gather and analyze information',
    color: 'bg-green-500',
  },
  {
    id: 'ANALYSIS',
    name: 'Analysis',
    icon: BarChart3,
    description: 'Process data and generate insights',
    color: 'bg-purple-500',
  },
  {
    id: 'GENERAL',
    name: 'General',
    icon: Bot,
    description: 'General-purpose assistant',
    color: 'bg-gray-500',
  },
  {
    id: 'CUSTOM',
    name: 'Custom',
    icon: Sparkles,
    description: 'Build from scratch with custom config',
    color: 'bg-orange-500',
  },
]

const agentTemplates = [
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    type: 'CODING',
    description: 'Reviews pull requests and suggests improvements',
    systemPrompt:
      'You are an expert code reviewer. Analyze code changes, identify bugs, suggest improvements, and ensure best practices are followed. Be constructive and educational in your feedback.',
    tools: ['code_execution', 'file_operations'],
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    type: 'RESEARCH',
    description: 'Gathers and summarizes information on topics',
    systemPrompt:
      'You are a thorough research assistant. Search for relevant information, synthesize findings, cite sources, and provide comprehensive summaries. Always verify facts and note any uncertainties.',
    tools: ['web_search', 'file_operations'],
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    type: 'ANALYSIS',
    description: 'Analyzes datasets and generates reports',
    systemPrompt:
      'You are a skilled data analyst. Process data, identify patterns, create visualizations, and generate actionable insights. Explain your methodology and findings clearly.',
    tools: ['code_execution', 'database', 'file_operations'],
  },
  {
    id: 'blank',
    name: 'Start from Scratch',
    type: 'GENERAL',
    description: 'Create a custom agent with your own configuration',
    systemPrompt: '',
    tools: [],
  },
]

const availableTools = [
  { id: 'web_search', name: 'Web Search', description: 'Search the internet for information' },
  { id: 'code_execution', name: 'Code Execution', description: 'Execute code in a sandbox' },
  { id: 'file_operations', name: 'File Operations', description: 'Read, write, and manage files' },
  { id: 'api_calls', name: 'API Calls', description: 'Make HTTP requests to external APIs' },
  { id: 'database', name: 'Database', description: 'Query and modify database records' },
  { id: 'email', name: 'Email', description: 'Send and read emails' },
]

export default function NewAgentPage() {
  const router = useRouter()
  const [step, setStep] = useState<'type' | 'template' | 'configure'>('type')
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    systemPrompt: '',
    tools: [] as string[],
  })

  function handleTypeSelect(typeId: string) {
    setFormData({ ...formData, type: typeId })
    setStep('template')
  }

  function handleTemplateSelect(template: (typeof agentTemplates)[0]) {
    setFormData({
      ...formData,
      name: template.id === 'blank' ? '' : template.name,
      description: template.description,
      type: template.type,
      systemPrompt: template.systemPrompt,
      tools: template.tools,
    })
    setStep('configure')
  }

  function toggleTool(toolId: string) {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter((t) => t !== toolId)
        : [...prev.tools, toolId],
    }))
  }

  async function handleCreate() {
    if (!formData.name.trim()) {
      alert('Please enter an agent name')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        const data = await response.json()
        router.push(`/agents/${data.agent.id}`)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to create agent')
      }
    } catch (error) {
      console.error('Failed to create agent:', error)
      alert('Failed to create agent')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/agents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Agent</h1>
          <p className="text-muted-foreground">Set up a new AI agent in a few steps</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[
          { id: 'type', label: 'Type' },
          { id: 'template', label: 'Template' },
          { id: 'configure', label: 'Configure' },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s.id
                  ? 'bg-primary text-primary-foreground'
                  : ['type', 'template', 'configure'].indexOf(step) >
                    ['type', 'template', 'configure'].indexOf(s.id)
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {['type', 'template', 'configure'].indexOf(step) >
              ['type', 'template', 'configure'].indexOf(s.id) ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div
                className={`mx-2 h-0.5 w-12 ${
                  ['type', 'template', 'configure'].indexOf(step) > i
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'type' && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Choose Agent Type</h2>
            <p className="text-muted-foreground">What kind of agent do you want to create?</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agentTypes.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  formData.type === type.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => handleTypeSelect(type.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${type.color} text-white`}
                    >
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{type.name}</CardTitle>
                      <CardDescription className="text-xs">{type.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 'template' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Choose a Template</h2>
              <p className="text-muted-foreground">Start with a pre-configured template or from scratch</p>
            </div>
            <Button variant="ghost" onClick={() => setStep('type')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {agentTemplates
              .filter((t) => t.type === formData.type || t.id === 'blank')
              .map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer transition-all hover:border-primary"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  {template.tools.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {template.tools.map((tool) => (
                          <span
                            key={tool}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            {availableTools.find((t) => t.id === tool)?.name || tool}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
          </div>
        </div>
      )}

      {step === 'configure' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Configure Your Agent</h2>
              <p className="text-muted-foreground">Customize the agent's settings</p>
            </div>
            <Button variant="ghost" onClick={() => setStep('template')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Name and describe your agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="My Agent"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this agent do?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {agentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Prompt</CardTitle>
                <CardDescription>Define the agent's behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="You are a helpful AI assistant..."
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tools</CardTitle>
                <CardDescription>Select which tools this agent can use</CardDescription>
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
                          className={`h-4 w-4 rounded border flex items-center justify-center ${
                            formData.tools.includes(tool.id)
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground'
                          }`}
                        >
                          {formData.tools.includes(tool.id) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{tool.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/agents">Cancel</Link>
            </Button>
            <Button onClick={handleCreate} disabled={creating || !formData.name.trim()}>
              {creating ? 'Creating...' : 'Create Agent'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
