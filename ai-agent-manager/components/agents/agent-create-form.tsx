'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Code,
  Search,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import {
  createAgentSchema,
  type CreateAgentInput,
  type AgentType,
} from '@/lib/validations/agent'
import { agentTemplates, availableTools } from '@/lib/agent-templates'

const typeIcons: Record<AgentType, React.ElementType> = {
  CODING: Code,
  RESEARCH: Search,
  ANALYSIS: BarChart3,
  GENERAL: MessageSquare,
  CUSTOM: Settings,
}

export function AgentCreateForm() {
  const router = useRouter()
  const [showFramework, setShowFramework] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateAgentInput>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'GENERAL',
      systemPrompt: agentTemplates.GENERAL.systemPrompt,
      tools: agentTemplates.GENERAL.tools,
      config: agentTemplates.GENERAL.config,
    },
  })

  const selectedType = form.watch('type')
  const selectedTools = form.watch('tools') || []

  const handleTypeSelect = (type: AgentType) => {
    const template = agentTemplates[type]
    form.setValue('type', type)
    form.setValue('systemPrompt', template.systemPrompt)
    form.setValue('tools', template.tools)
    form.setValue('config', template.config)
  }

  const handleToolToggle = (toolId: string) => {
    const current = form.getValues('tools') || []
    if (current.includes(toolId)) {
      form.setValue(
        'tools',
        current.filter((t) => t !== toolId)
      )
    } else {
      form.setValue('tools', [...current, toolId])
    }
  }

  const onSubmit = async (data: CreateAgentInput) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create agent')
      }

      const { agent } = await response.json()
      toast.success('Agent created successfully!')
      router.push(`/agents/${agent.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create agent')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Basic Information (Always Visible) */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Give your agent a name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Coding Assistant"
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormDescription>
                    A memorable name for your agent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this agent does..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description of the agent&apos;s purpose
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progressive disclosure toggle for framework */}
            {!showFramework && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowFramework(true)}
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Choose Agent Type
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Framework Selection (Progressive Disclosure) */}
        {showFramework && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agent Type</CardTitle>
                  <CardDescription>
                    Select a template or create a custom agent
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFramework(false)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.keys(agentTemplates) as AgentType[]).map((type) => {
                  const template = agentTemplates[type]
                  const Icon = typeIcons[type]
                  const isSelected = selectedType === type

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeSelect(type)}
                      className={cn(
                        'relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:bg-accent',
                        isSelected && 'border-primary bg-accent'
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-md',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{template.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* System Prompt (shown after type selection) */}
              <FormField
                control={form.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Define your agent's behavior and capabilities..."
                        className="resize-none font-mono text-sm"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Instructions that define how your agent behaves
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Progressive disclosure toggle for advanced */}
              {!showAdvanced && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAdvanced(true)}
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Advanced Configuration
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Advanced Configuration (Progressive Disclosure) */}
        {showFramework && showAdvanced && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Advanced Configuration</CardTitle>
                  <CardDescription>
                    Fine-tune your agent&apos;s capabilities
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(false)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tools Selection */}
              <div className="space-y-3">
                <Label>Available Tools</Label>
                <p className="text-sm text-muted-foreground">
                  Select the tools your agent can use
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableTools.map((tool) => {
                    const isSelected = selectedTools.includes(tool.id)
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleToolToggle(tool.id)}
                        className={cn(
                          'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-all hover:bg-accent',
                          isSelected && 'border-primary bg-accent'
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm font-medium">
                            {tool.label}
                          </span>
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {tool.description}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Model Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="config.maxTokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Tokens</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="4096"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum output length
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          placeholder="0.7"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Creativity level (0-2)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.retryAttempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retry Attempts</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          placeholder="2"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Retries on failure (0-10)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="config.confidenceThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confidence Threshold</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          placeholder="0.7"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Min confidence for actions (0-1)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Agent'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
