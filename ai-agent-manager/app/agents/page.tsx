"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agents";
import { Navigation } from "@/components/layout/navigation";
import { agentApi, type Agent, type AgentStatus } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { value: AgentStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "IDLE", label: "Idle" },
  { value: "RUNNING", label: "Running" },
  { value: "PAUSED", label: "Paused" },
  { value: "ERROR", label: "Error" },
  { value: "TERMINATED", label: "Terminated" },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "ALL">("ALL");

  useEffect(() => {
    async function loadAgents() {
      try {
        setIsLoading(true);
        const data = await agentApi.list();
        setAgents(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load agents:", err);
        setError("Failed to load agents. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadAgents();
  }, []);

  const filteredAgents =
    statusFilter === "ALL"
      ? agents
      : agents.filter((agent) => agent.status === statusFilter);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
              <p className="text-muted-foreground mt-1">
                Manage and monitor your AI agents
              </p>
            </div>
            <Button asChild>
              <Link href="/agents/new">
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              {STATUS_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "rounded-full",
                    statusFilter === filter.value && "pointer-events-none"
                  )}
                >
                  {filter.label}
                  {filter.value !== "ALL" && (
                    <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-xs">
                      {agents.filter((a) => a.status === filter.value).length}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No agents found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === "ALL"
                    ? "Create your first agent to get started."
                    : `No agents with status "${statusFilter.toLowerCase()}".`}
                </p>
              </div>
              {statusFilter === "ALL" && (
                <Button asChild>
                  <Link href="/agents/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
