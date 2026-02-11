import type { AgentType } from './validations/agent'

export interface AgentTemplate {
  type: AgentType
  label: string
  description: string
  icon: string
  systemPrompt: string
  tools: string[]
  config: {
    maxTokens?: number
    temperature?: number
    model?: string
    timeout?: number
    retryAttempts?: number
    confidenceThreshold?: number
  }
}

export const agentTemplates: Record<AgentType, AgentTemplate> = {
  CODING: {
    type: 'CODING',
    label: 'Coding Assistant',
    description: 'Specialized for software development tasks, code review, and debugging',
    icon: 'Code',
    systemPrompt: `You are an expert software engineer assistant. Your role is to:
- Write clean, well-documented code
- Review code for bugs, security issues, and best practices
- Debug and troubleshoot issues
- Explain complex technical concepts clearly
- Follow the coding standards and patterns of the project`,
    tools: ['code_search', 'file_edit', 'terminal', 'git'],
    config: {
      maxTokens: 4096,
      temperature: 0.3,
      retryAttempts: 2,
      confidenceThreshold: 0.8,
    },
  },
  RESEARCH: {
    type: 'RESEARCH',
    label: 'Research Agent',
    description: 'Gathers and synthesizes information from multiple sources',
    icon: 'Search',
    systemPrompt: `You are a thorough research assistant. Your role is to:
- Search for relevant information across multiple sources
- Synthesize findings into clear, actionable insights
- Cite sources and provide references
- Identify gaps in available information
- Present balanced perspectives on complex topics`,
    tools: ['web_search', 'document_reader', 'summarizer'],
    config: {
      maxTokens: 8192,
      temperature: 0.5,
      retryAttempts: 3,
      confidenceThreshold: 0.7,
    },
  },
  ANALYSIS: {
    type: 'ANALYSIS',
    label: 'Data Analyst',
    description: 'Analyzes data patterns and generates insights',
    icon: 'BarChart',
    systemPrompt: `You are a data analysis expert. Your role is to:
- Analyze datasets for patterns and anomalies
- Generate statistical summaries and visualizations
- Build and evaluate predictive models
- Explain findings in business-friendly terms
- Recommend data-driven actions`,
    tools: ['data_query', 'chart_generator', 'statistics'],
    config: {
      maxTokens: 4096,
      temperature: 0.2,
      retryAttempts: 2,
      confidenceThreshold: 0.85,
    },
  },
  GENERAL: {
    type: 'GENERAL',
    label: 'General Assistant',
    description: 'Versatile assistant for various tasks and conversations',
    icon: 'MessageSquare',
    systemPrompt: `You are a helpful, versatile AI assistant. Your role is to:
- Answer questions accurately and helpfully
- Help with writing, editing, and communication
- Assist with planning and organization
- Provide clear explanations and guidance
- Be friendly and professional in all interactions`,
    tools: ['web_search', 'calculator', 'calendar'],
    config: {
      maxTokens: 2048,
      temperature: 0.7,
      retryAttempts: 1,
      confidenceThreshold: 0.6,
    },
  },
  CUSTOM: {
    type: 'CUSTOM',
    label: 'Custom Agent',
    description: 'Build a fully customized agent from scratch',
    icon: 'Settings',
    systemPrompt: '',
    tools: [],
    config: {
      maxTokens: 4096,
      temperature: 0.5,
      retryAttempts: 2,
      confidenceThreshold: 0.7,
    },
  },
}

export const availableTools = [
  { id: 'code_search', label: 'Code Search', description: 'Search through codebase' },
  { id: 'file_edit', label: 'File Editor', description: 'Read and write files' },
  { id: 'terminal', label: 'Terminal', description: 'Execute shell commands' },
  { id: 'git', label: 'Git', description: 'Version control operations' },
  { id: 'web_search', label: 'Web Search', description: 'Search the internet' },
  { id: 'document_reader', label: 'Document Reader', description: 'Read various document formats' },
  { id: 'summarizer', label: 'Summarizer', description: 'Summarize long content' },
  { id: 'data_query', label: 'Data Query', description: 'Query databases and datasets' },
  { id: 'chart_generator', label: 'Chart Generator', description: 'Create visualizations' },
  { id: 'statistics', label: 'Statistics', description: 'Statistical analysis tools' },
  { id: 'calculator', label: 'Calculator', description: 'Mathematical calculations' },
  { id: 'calendar', label: 'Calendar', description: 'Schedule and time management' },
] as const

export type AvailableTool = (typeof availableTools)[number]['id']
