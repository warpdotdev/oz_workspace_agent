"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Code,
  Search,
  BarChart3,
  Sparkles,
  Settings,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  agentApi,
  AGENT_FRAMEWORKS,
  type AgentType,
  type FrameworkId,
  type CreateAgentInput,
} from "@/lib/api-client";
import { toast } from "sonner";

// Map framework IDs to agent types
const frameworkToType: Record<FrameworkId, AgentType> = {
  langchain: "CODING",
  crewai: "GENERAL",
  autogpt: "GENERAL",
  openai: "GENERAL",
  anthropic: "GENERAL",
  custom: "CUSTOM",
};

// Agent templates for quick-start
interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  type: AgentType;
  framework: FrameworkId;
  systemPrompt: string;
  tools: string[];
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "code-review",
    name: "Code Review Assistant",
    description: "Reviews code for bugs, style issues, and best practices",
    icon: Code,
    color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
    type: "CODING",
    framework: "langchain",
    systemPrompt: "You are an expert code reviewer. Analyze code for bugs, security vulnerabilities, performance issues, and style inconsistencies. Provide actionable feedback with specific line references.",
    tools: ["code_execution", "file_operations"],
  },
  {
    id: "research",
    name: "Research Agent",
    description: "Gathers and synthesizes information from multiple sources",
    icon: Search,
    color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
    type: "RESEARCH",
    framework: "crewai",
    systemPrompt: "You are a thorough research assistant. Search for information, verify facts from multiple sources, and synthesize findings into clear summaries with citations.",
    tools: ["web_search", "api_calls"],
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    description: "Analyzes data and generates insights with visualizations",
    icon: BarChart3,
    color: "text-green-500 bg-green-100 dark:bg-green-900/30",
    type: "ANALYSIS",
    framework: "langchain",
    systemPrompt: "You are a data analyst. Query databases, perform statistical analysis, identify patterns and trends, and generate clear visualizations and reports.",
    tools: ["database", "code_execution"],
  },
  {
    id: "general",
    name: "General Assistant",
    description: "Versatile agent for everyday tasks and questions",
    icon: Sparkles,
    color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
    type: "GENERAL",
    framework: "openai",
    systemPrompt: "You are a helpful assistant. Answer questions, help with tasks, and provide useful information in a clear and friendly manner.",
    tools: ["web_search"],
  },
  {
    id: "custom",
    name: "Custom Agent",
    description: "Start from scratch with full control over configuration",
    icon: Settings,
    color: "text-gray-500 bg-gray-100 dark:bg-gray-900/30",
    type: "CUSTOM",
    framework: "custom",
    systemPrompt: "",
    tools: [],
  },
];

interface AgentFormData {
  // Step 1: Basic Info + Template
  name: string;
  description: string;
  templateId: string | null;
  // Step 2: Framework
  framework: FrameworkId | null;
  // Step 3: Advanced Config
  systemPrompt: string;
  tools: string[];
  config: Record<string, unknown>;
}

// Validation errors interface
interface FormErrors {
  name?: string;
  description?: string;
}

const initialFormData: AgentFormData = {
  name: "",
  description: "",
  templateId: null,
  framework: null,
  systemPrompt: "",
  tools: [],
  config: {},
};

// Character limits
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 500;

// Available tools for selection
const AVAILABLE_TOOLS = [
  { id: "web_search", name: "Web Search", description: "Search the web for information" },
  { id: "code_execution", name: "Code Execution", description: "Execute code snippets" },
  { id: "file_operations", name: "File Operations", description: "Read and write files" },
  { id: "api_calls", name: "API Calls", description: "Make HTTP requests to APIs" },
  { id: "database", name: "Database", description: "Query databases" },
  { id: "image_generation", name: "Image Generation", description: "Generate images" },
];

export function AgentForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<AgentFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate name field
  const validateName = useCallback((name: string): string | undefined => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return "Name is required";
    }
    if (trimmed.length < NAME_MIN_LENGTH) {
      return `Name must be at least ${NAME_MIN_LENGTH} characters`;
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      return `Name must be at most ${NAME_MAX_LENGTH} characters`;
    }
    return undefined;
  }, []);

  // Validate description field
  const validateDescription = useCallback((desc: string): string | undefined => {
    if (desc.length > DESCRIPTION_MAX_LENGTH) {
      return `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`;
    }
    return undefined;
  }, []);

  // Update form data with validation
  const updateFormData = useCallback((updates: Partial<AgentFormData>) => {
    setFormData((prev) => {
      const newData = { ...prev, ...updates };
      
      // Validate updated fields
      const newErrors: FormErrors = { ...errors };
      if ("name" in updates) {
        newErrors.name = validateName(updates.name || "");
      }
      if ("description" in updates) {
        newErrors.description = validateDescription(updates.description || "");
      }
      setErrors(newErrors);
      
      return newData;
    });
  }, [errors, validateName, validateDescription]);

  // Handle field blur for touched state
  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = AGENT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    setFormData((prev) => ({
      ...prev,
      templateId,
      name: prev.name || template.name,
      description: prev.description || template.description,
      framework: template.framework,
      systemPrompt: template.systemPrompt,
      tools: template.tools,
    }));
  }, []);

  // Computed validation states
  const canProceedStep1 = useMemo(() => {
    const nameError = validateName(formData.name);
    const descError = validateDescription(formData.description);
    return !nameError && !descError;
  }, [formData.name, formData.description, validateName, validateDescription]);

  const canProceedStep2 = formData.framework !== null;
  const canSubmit = canProceedStep1 && canProceedStep2;

  const handleSubmit = async () => {
    if (!canSubmit || !formData.framework) return;

    setIsSubmitting(true);
    try {
      const createInput: CreateAgentInput = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: frameworkToType[formData.framework],
        systemPrompt: formData.systemPrompt.trim() || undefined,
        tools: formData.tools.length > 0 ? formData.tools : undefined,
        config: Object.keys(formData.config).length > 0 ? formData.config : undefined,
      };

      const agent = await agentApi.create(createInput);
      toast.success(`Agent "${agent.name}" created successfully!`);
      router.push(`/agents/${agent.id}`);
    } catch (error) {
      console.error("Failed to create agent:", error);
      toast.error("Failed to create agent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTool = useCallback((toolId: string) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter((t) => t !== toolId)
        : [...prev.tools, toolId],
    }));
  }, []);

  // Get selected template for preview
  const selectedTemplate = useMemo(() => {
    return AGENT_TEMPLATES.find((t) => t.id === formData.templateId);
  }, [formData.templateId]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors",
                  step >= s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "h-0.5 w-24 sm:w-32 md:w-40 mx-2 transition-colors",
                    step > s ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={cn(step >= 1 ? "text-foreground" : "text-muted-foreground")}>
            Basic Info
          </span>
          <span className={cn(step >= 2 ? "text-foreground" : "text-muted-foreground")}>
            Framework
          </span>
          <span className={cn(step >= 3 ? "text-foreground" : "text-muted-foreground")}>
            Configuration
          </span>
        </div>
      </div>

      {/* Step 1: Basic Info + Template Selection */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Quick Start Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Start Templates
              </CardTitle>
              <CardDescription>
                Choose a template to get started quickly, or create from scratch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {AGENT_TEMPLATES.map((template) => {
                  const TemplateIcon = template.icon;
                  const isSelected = formData.templateId === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:border-primary/50",
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            template.color
                          )}
                        >
                          <TemplateIcon className="h-4 w-4" />
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Template Preview (when selected) */}
          {selectedTemplate && selectedTemplate.id !== "custom" && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Template Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selectedTemplate.type}</Badge>
                  <Badge variant="outline">{selectedTemplate.framework}</Badge>
                  {selectedTemplate.tools.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-xs">
                      {tool.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
                {selectedTemplate.systemPrompt && (
                  <p className="text-muted-foreground text-xs line-clamp-2">
                    {selectedTemplate.systemPrompt}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Basic Info Form */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Details</CardTitle>
              <CardDescription>
                Customize your agent&apos;s name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Agent Name *</Label>
                  <span className={cn(
                    "text-xs",
                    formData.name.length > NAME_MAX_LENGTH
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}>
                    {formData.name.length}/{NAME_MAX_LENGTH}
                  </span>
                </div>
                <Input
                  id="name"
                  placeholder="e.g., Code Review Assistant"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  onBlur={() => handleBlur("name")}
                  maxLength={NAME_MAX_LENGTH + 10}
                  className={cn(
                    touched.name && errors.name && "border-destructive focus-visible:ring-destructive"
                  )}
                  autoFocus
                />
                {touched.name && errors.name ? (
                  <p className="text-xs text-destructive">{errors.name}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    A short, memorable name for your agent
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <span className={cn(
                    "text-xs",
                    formData.description.length > DESCRIPTION_MAX_LENGTH
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}>
                    {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe what this agent will do..."
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  onBlur={() => handleBlur("description")}
                  rows={3}
                  className={cn(
                    touched.description && errors.description && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {touched.description && errors.description ? (
                  <p className="text-xs text-destructive">{errors.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Optional: Help others understand this agent&apos;s purpose
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Framework Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a Framework</CardTitle>
            <CardDescription>
              Select the AI framework that best fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {AGENT_FRAMEWORKS.map((framework) => (
                <button
                  key={framework.id}
                  type="button"
                  onClick={() => updateFormData({ framework: framework.id })}
                  className={cn(
                    "flex items-start gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary/50",
                    formData.framework === framework.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 mt-0.5 shrink-0 items-center justify-center rounded-full border",
                      formData.framework === framework.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {formData.framework === framework.id && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{framework.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {framework.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Advanced Configuration (Optional) */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Configuration</CardTitle>
            <CardDescription>
              Optional: Fine-tune your agent&apos;s behavior. You can skip this and configure later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                placeholder="You are a helpful assistant that..."
                value={formData.systemPrompt}
                onChange={(e) => updateFormData({ systemPrompt: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Instructions that define how your agent behaves
              </p>
            </div>

            <div className="space-y-3">
              <Label>Available Tools</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {AVAILABLE_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary/50",
                      formData.tools.includes(tool.id)
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        formData.tools.includes(tool.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {formData.tools.includes(tool.id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Agent
                <Check className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Skip step 3 hint */}
      {step === 3 && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          All fields on this page are optional. Click &quot;Create Agent&quot; to finish.
        </p>
      )}
    </div>
  );
}
