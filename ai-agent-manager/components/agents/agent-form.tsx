"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

interface AgentFormData {
  // Step 1: Basic Info
  name: string;
  description: string;
  // Step 2: Framework
  framework: FrameworkId | null;
  // Step 3: Advanced Config
  systemPrompt: string;
  tools: string[];
  config: Record<string, unknown>;
}

const initialFormData: AgentFormData = {
  name: "",
  description: "",
  framework: null,
  systemPrompt: "",
  tools: [],
  config: {},
};

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

  const updateFormData = (updates: Partial<AgentFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceedStep1 = formData.name.trim().length >= 2;
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

  const toggleTool = (toolId: string) => {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter((t) => t !== toolId)
        : [...prev.tools, toolId],
    }));
  };

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

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Create Your Agent</CardTitle>
            <CardDescription>
              Start with a name and description. You can always add more details later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Code Review Assistant"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                A short, memorable name for your agent
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this agent will do..."
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Help others understand this agent&apos;s purpose
              </p>
            </div>
          </CardContent>
        </Card>
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
