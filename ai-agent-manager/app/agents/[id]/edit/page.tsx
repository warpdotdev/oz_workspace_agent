"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navigation } from "@/components/layout/navigation";
import { cn } from "@/lib/utils";
import {
  agentApi,
  type Agent,
  type AgentType,
  type UpdateAgentInput,
} from "@/lib/api-client";
import { toast } from "sonner";

const AGENT_TYPES: { value: AgentType; label: string }[] = [
  { value: "CODING", label: "Coding" },
  { value: "RESEARCH", label: "Research" },
  { value: "ANALYSIS", label: "Analysis" },
  { value: "GENERAL", label: "General" },
  { value: "CUSTOM", label: "Custom" },
];

const AVAILABLE_TOOLS = [
  { id: "web_search", name: "Web Search", description: "Search the web for information" },
  { id: "code_execution", name: "Code Execution", description: "Execute code snippets" },
  { id: "file_operations", name: "File Operations", description: "Read and write files" },
  { id: "api_calls", name: "API Calls", description: "Make HTTP requests to APIs" },
  { id: "database", name: "Database", description: "Query databases" },
  { id: "image_generation", name: "Image Generation", description: "Generate images" },
];

export default function EditAgentPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AgentType>("GENERAL");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tools, setTools] = useState<string[]>([]);

  useEffect(() => {
    async function loadAgent() {
      try {
        setIsLoading(true);
        const data = await agentApi.get(agentId);
        setAgent(data);
        // Populate form
        setName(data.name);
        setDescription(data.description || "");
        setType(data.type);
        setSystemPrompt(data.systemPrompt || "");
        setTools(data.tools || []);
        setError(null);
      } catch (err) {
        console.error("Failed to load agent:", err);
        setError("Failed to load agent details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadAgent();
  }, [agentId]);

  const handleSave = async () => {
    if (!agent) return;
    
    setIsSaving(true);
    try {
      const updateInput: UpdateAgentInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        systemPrompt: systemPrompt.trim() || undefined,
        tools: tools.length > 0 ? tools : undefined,
      };

      await agentApi.update(agentId, updateInput);
      toast.success("Agent updated successfully");
      router.push(`/agents/${agentId}`);
    } catch (err) {
      console.error("Failed to update agent:", err);
      toast.error("Failed to update agent");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTool = (toolId: string) => {
    setTools((prev) =>
      prev.includes(toolId)
        ? prev.filter((t) => t !== toolId)
        : [...prev, toolId]
    );
  };

  const canSave = name.trim().length >= 2;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-8">
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-destructive">{error || "Agent not found"}</p>
            <Button asChild>
              <Link href="/agents">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Agents
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-8 max-w-2xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/agents/${agentId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Agent
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
          <p className="text-muted-foreground mt-1">
            Update your agent&apos;s configuration
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Code Review Assistant"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this agent does..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Agent Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as AgentType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Instructions that define how your agent behaves
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant that..."
                rows={6}
              />
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Tools</CardTitle>
              <CardDescription>
                Select the capabilities available to this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {AVAILABLE_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => toggleTool(tool.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary/50",
                      tools.includes(tool.id)
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        tools.includes(tool.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {tools.includes(tool.id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tool.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href={`/agents/${agentId}`}>Cancel</Link>
            </Button>
            <Button onClick={handleSave} disabled={!canSave || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
