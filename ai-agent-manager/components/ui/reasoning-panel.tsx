"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Brain, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface ReasoningStep {
  timestamp?: string;
  action: string;
  reasoning: string;
  outcome?: "success" | "error" | "pending";
  confidence?: number;
}

interface ReasoningPanelProps {
  reasoningLog: ReasoningStep[] | Record<string, unknown> | null | undefined;
  executionSteps?: ReasoningStep[] | Record<string, unknown> | null | undefined;
  title?: string;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * ReasoningPanel - Expandable panel to display agent reasoning for transparency
 * 
 * Per product-lead guidance: "every task outcome will be scrutinized by users"
 * This component makes agent decisions explainable and reviewable.
 */
export function ReasoningPanel({
  reasoningLog,
  executionSteps,
  title = "Agent Reasoning",
  defaultExpanded = false,
  className
}: ReasoningPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Normalize reasoning data to array format
  const normalizeSteps = (data: ReasoningStep[] | Record<string, unknown> | null | undefined): ReasoningStep[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    // If it's an object, try to extract steps
    if (typeof data === "object" && data !== null) {
      if ("steps" in data && Array.isArray(data.steps)) {
        return data.steps as ReasoningStep[];
      }
      // Convert object to single step
      return [{
        action: "Decision",
        reasoning: JSON.stringify(data, null, 2),
        outcome: "success"
      }];
    }
    return [];
  };

  const reasoning = normalizeSteps(reasoningLog);
  const execution = normalizeSteps(executionSteps);
  const allSteps = [...reasoning, ...execution];

  if (allSteps.length === 0) {
    return null;
  }

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Brain className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">
            ({allSteps.length} step{allSteps.length !== 1 ? "s" : ""})
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t px-4 py-3 space-y-3">
          {allSteps.map((step, index) => (
            <div 
              key={index} 
              className="flex gap-3 pb-3 border-b last:border-b-0 last:pb-0"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getOutcomeIcon(step.outcome)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{step.action}</span>
                  {step.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                  {step.confidence !== undefined && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      step.confidence >= 0.8 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      step.confidence >= 0.5 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {Math.round(step.confidence * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {step.reasoning}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ErrorPanel - Display error information as first-class feature
 */
interface ErrorPanelProps {
  errorMessage: string | null | undefined;
  errorCode?: string | null | undefined;
  retryCount?: number;
  lastRetryAt?: string | null | undefined;
  className?: string;
}

export function ErrorPanel({
  errorMessage,
  errorCode,
  retryCount = 0,
  lastRetryAt,
  className
}: ErrorPanelProps) {
  if (!errorMessage) return null;

  return (
    <div className={cn(
      "border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 p-4",
      className
    )}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-red-700 dark:text-red-400">Error</span>
            {errorCode && (
              <code className="text-xs bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400">
                {errorCode}
              </code>
            )}
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mb-2">
            {errorMessage}
          </p>
          {(retryCount > 0 || lastRetryAt) && (
            <div className="flex items-center gap-3 text-xs text-red-500">
              {retryCount > 0 && (
                <span>Retry attempts: {retryCount}</span>
              )}
              {lastRetryAt && (
                <span>Last retry: {new Date(lastRetryAt).toLocaleString()}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ReviewBadge - Indicates if task needs human review
 */
export function ReviewBadge({ 
  requiresReview,
  reviewedAt,
  reviewedBy,
  className 
}: { 
  requiresReview: boolean;
  reviewedAt?: string | null;
  reviewedBy?: { name?: string; email?: string } | null;
  className?: string;
}) {
  if (!requiresReview && !reviewedAt) return null;

  if (reviewedAt) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        className
      )}>
        <CheckCircle className="w-3 h-3" />
        <span>Reviewed{reviewedBy?.name ? ` by ${reviewedBy.name}` : ""}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse",
      className
    )}>
      <AlertTriangle className="w-3 h-3" />
      <span>Needs Review</span>
    </div>
  );
}
