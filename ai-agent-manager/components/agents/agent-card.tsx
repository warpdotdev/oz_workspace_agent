"use client";

import Link from "next/link";
import { Bot, Code, Search, BarChart3, Sparkles, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Agent, AgentType } from "@/lib/api-client";
import { StatusBadge } from "./status-badge";
import { ConfidenceBadge } from "./confidence-badge";

interface AgentCardProps {
  agent: Agent;
  className?: string;
}

// Agent type icons and colors
const agentTypeConfig: Record<
  AgentType,
  { icon: React.ElementType; label: string; color: string }
> = {
  CODING: {
    icon: Code,
    label: "Coding",
    color: "text-purple-500",
  },
  RESEARCH: {
    icon: Search,
    label: "Research",
    color: "text-blue-500",
  },
  ANALYSIS: {
    icon: BarChart3,
    label: "Analysis",
    color: "text-green-500",
  },
  GENERAL: {
    icon: Sparkles,
    label: "General",
    color: "text-amber-500",
  },
  CUSTOM: {
    icon: Settings,
    label: "Custom",
    color: "text-gray-500",
  },
};

export function AgentCard({ agent, className }: AgentCardProps) {
  const typeConfig = agentTypeConfig[agent.type];
  const TypeIcon = typeConfig.icon;

  return (
    <Link href={`/agents/${agent.id}`}>
      <Card
        className={cn(
          "group cursor-pointer transition-all hover:shadow-md hover:border-primary/20",
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg bg-muted",
                  "group-hover:bg-primary/10 transition-colors"
                )}
              >
                <Bot className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold truncate flex items-center gap-2">
                  {agent.name}
                  {agent.confidenceScore !== undefined && (
                    <ConfidenceBadge score={agent.confidenceScore} size="sm" showLabel={false} />
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <TypeIcon className={cn("h-3.5 w-3.5", typeConfig.color)} />
                  <span className="text-xs text-muted-foreground">{typeConfig.label}</span>
                </div>
              </div>
            </div>
            <StatusBadge status={agent.status} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="line-clamp-2 text-sm">
            {agent.description || "No description provided"}
          </CardDescription>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Created {new Date(agent.createdAt).toLocaleDateString()}
            </span>
            {agent.tools.length > 0 && (
              <span>{agent.tools.length} tool{agent.tools.length !== 1 ? "s" : ""}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
