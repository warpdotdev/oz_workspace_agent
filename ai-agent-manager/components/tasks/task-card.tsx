"use client";

import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { ReviewBadge, ErrorPanel, ReasoningPanel } from "@/components/ui/reasoning-panel";
import { 
  GripVertical, 
  Calendar, 
  User, 
  Bot, 
  MoreHorizontal,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { forwardRef } from "react";

// Task type matching Prisma schema with trust fields
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  projectId?: string | null;
  assigneeId?: string | null;
  agentId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  
  // Trust calibration fields
  confidenceScore?: number | null;
  reasoningLog?: Record<string, unknown> | null;
  executionSteps?: Record<string, unknown> | null;
  requiresReview: boolean;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  
  // Error tracking
  errorMessage?: string | null;
  errorCode?: string | null;
  retryCount: number;
  lastRetryAt?: string | null;
  
  // Relations
  project?: { id: string; name: string } | null;
  assignee?: { id: string; name?: string | null; email: string; image?: string | null } | null;
  agent?: { id: string; name: string; type: string; status: string } | null;
  createdBy: { id: string; name?: string | null; email: string };
  reviewedBy?: { id: string; name?: string | null; email: string } | null;
}

type CardDensity = 'compact' | 'comfortable' | 'spacious'

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onClick?: () => void;
  isDragging?: boolean;
  showDetails?: boolean;
  density?: CardDensity;
}

/**
 * TaskCard - Displays task information with trust indicators
 * 
 * Per product-lead guidance:
 * - Error states and reasoning fields are first-class features
 * - Every task outcome will be scrutinized by users
 * - Transparency + control is the competitive moat
 */
export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps & { style?: React.CSSProperties; attributes?: Record<string, unknown>; listeners?: Record<string, unknown> }>(function TaskCard({ 
  task, 
  onEdit, 
  onDelete,
  onClick,
  isDragging = false,
  showDetails = false,
  density = 'comfortable',
  style,
  attributes,
  listeners,
  ...props
}, ref) {
  const isCompact = density === 'compact'
  const isSpaciouos = density === 'spacious'

  // Status colors per design-lead guidance
  const statusColors = {
    TODO: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    DONE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const priorityColors = {
    LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    MEDIUM: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    HIGH: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    URGENT: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  const hasError = !!task.errorMessage;
  const needsAttention = task.requiresReview || hasError || (task.confidenceScore !== null && task.confidenceScore !== undefined && task.confidenceScore < 0.5);

  return (
    <div
      ref={ref}
      style={style}
      onClick={onClick}
      {...props}
      className={cn(
        "bg-card border rounded-lg shadow-sm transition-all cursor-pointer",
        isCompact ? "p-2" : isSpaciouos ? "p-5" : "p-3",
        isDragging && "opacity-50 shadow-lg",
        needsAttention && "ring-2 ring-amber-400 dark:ring-amber-500",
        hasError && "ring-2 ring-red-400 dark:ring-red-500"
      )}
    >
      {/* Header with drag handle and actions */}
      <div className="flex items-start gap-2 mb-2">
        <button
          className="p-1 -ml-1 hover:bg-accent rounded cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{task.title}</h3>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {task.description}
            </p>
          )}
        </div>

        {(onEdit || onDelete) && (
          <button 
            className="p-1 hover:bg-accent rounded"
            onClick={() => onEdit?.(task)}
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Trust indicators row */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {/* Confidence Badge - key trust calibration feature */}
        {task.confidenceScore !== null && task.confidenceScore !== undefined && (
          <ConfidenceBadge 
            score={task.confidenceScore} 
            size="sm" 
            showLabel={false}
          />
        )}

        {/* Review status */}
        <ReviewBadge 
          requiresReview={task.requiresReview}
          reviewedAt={task.reviewedAt}
          reviewedBy={task.reviewedBy ? { name: task.reviewedBy.name ?? undefined, email: task.reviewedBy.email } : undefined}
        />

        {/* Error indicator */}
        {hasError && (
          <div className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-3 h-3" />
            <span>Error</span>
          </div>
        )}
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <Badge variant="outline" className={cn("text-xs", priorityColors[task.priority])}>
          {task.priority}
        </Badge>
        
        {task.project && (
          <Badge variant="outline" className="text-xs">
            {task.project.name}
          </Badge>
        )}
      </div>

      {/* Assignee/Agent info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {task.assignee && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{task.assignee.name || task.assignee.email}</span>
          </div>
        )}
        
        {task.agent && (
          <div className="flex items-center gap-1">
            <Bot className="w-3 h-3" />
            <span>{task.agent.name}</span>
          </div>
        )}
        
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Expanded details - Error and Reasoning panels */}
      {showDetails && (
        <div className="mt-3 space-y-2">
          {/* Error panel - errors are first-class features */}
          <ErrorPanel
            errorMessage={task.errorMessage}
            errorCode={task.errorCode}
            retryCount={task.retryCount}
            lastRetryAt={task.lastRetryAt}
          />

          {/* Reasoning panel - transparency feature */}
          <ReasoningPanel
            reasoningLog={task.reasoningLog}
            executionSteps={task.executionSteps as Record<string, unknown> | null | undefined}
            title="Task Reasoning"
          />
        </div>
      )}
    </div>
  );
});

/**
 * TaskCardSkeleton - Loading placeholder
 */
export function TaskCardSkeleton() {
  return (
    <div className="bg-card border rounded-lg p-3 animate-pulse">
      <div className="flex items-start gap-2 mb-2">
        <div className="w-4 h-4 bg-muted rounded" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-3/4 mb-1" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mb-2">
        <div className="h-5 bg-muted rounded w-16" />
        <div className="h-5 bg-muted rounded w-12" />
      </div>
      <div className="flex gap-2">
        <div className="h-4 bg-muted rounded w-20" />
        <div className="h-4 bg-muted rounded w-16" />
      </div>
    </div>
  );
}
