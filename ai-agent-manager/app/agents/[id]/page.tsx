"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Loader2,
  Bot,
  Clock,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Navigation } from "@/components/layout/navigation";
import { StatusBadge, ConfidenceBadge } from "@/components/agents";
import { agentApi, type Agent } from "@/lib/api-client";
import { toast } from "sonner";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isControlling, setIsControlling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgent() {
      try {
        setIsLoading(true);
        const data = await agentApi.get(agentId);
        setAgent(data);
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await agentApi.delete(agentId);
      toast.success("Agent deleted successfully");
      router.push("/agents");
    } catch (err) {
      console.error("Failed to delete agent:", err);
      toast.error("Failed to delete agent");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleControl = async (action: "start" | "stop" | "pause" | "resume") => {
    if (!agent) return;
    setIsControlling(true);
    try {
      let updatedAgent: Agent;
      switch (action) {
        case "start":
          updatedAgent = await agentApi.start(agentId);
          break;
        case "stop":
          updatedAgent = await agentApi.stop(agentId);
          break;
        case "pause":
          updatedAgent = await agentApi.pause(agentId);
          break;
        case "resume":
          updatedAgent = await agentApi.resume(agentId);
          break;
      }
      setAgent(updatedAgent);
      toast.success(`Agent ${action}ed successfully`);
    } catch (err) {
      console.error(`Failed to ${action} agent:`, err);
      toast.error(`Failed to ${action} agent`);
    } finally {
      setIsControlling(false);
    }
  };

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
      <main className="container py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/agents"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Agents
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
                {agent.confidenceScore !== undefined && (
                  <ConfidenceBadge score={agent.confidenceScore} />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={agent.status} />
                <Badge variant="outline">{agent.type}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Control buttons */}
            {agent.status === "IDLE" && (
              <Button
                variant="outline"
                onClick={() => handleControl("start")}
                disabled={isControlling}
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
            {agent.status === "RUNNING" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleControl("pause")}
                  disabled={isControlling}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleControl("stop")}
                  disabled={isControlling}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </>
            )}
            {agent.status === "PAUSED" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleControl("resume")}
                  disabled={isControlling}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Resume
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleControl("stop")}
                  disabled={isControlling}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </>
            )}

            <Button asChild variant="outline">
              <Link href={`/agents/${agentId}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Agent</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &quot;{agent.name}&quot;? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Description
                </div>
                <p className="mt-1">
                  {agent.description || "No description provided"}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Created
                  </div>
                  <p className="mt-1 text-sm">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Updated
                  </div>
                  <p className="mt-1 text-sm">
                    {new Date(agent.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Tools
              </CardTitle>
              <CardDescription>
                Capabilities enabled for this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agent.tools.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agent.tools.map((tool) => (
                    <Badge key={tool} variant="secondary">
                      {tool.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tools configured
                </p>
              )}
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Instructions that define how this agent behaves
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agent.systemPrompt ? (
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                  {agent.systemPrompt}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No system prompt configured
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
