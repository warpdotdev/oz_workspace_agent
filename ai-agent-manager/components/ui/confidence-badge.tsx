"use client";

import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  score: number | null | undefined;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * ConfidenceBadge - Displays confidence scores with semantic color coding
 * 
 * Color scale based on product-lead trust calibration requirements:
 * - High (0.8-1.0): Green - High confidence, likely correct
 * - Medium (0.5-0.79): Yellow/Amber - Moderate confidence, may need review
 * - Low (0.2-0.49): Orange - Low confidence, should be reviewed
 * - Very Low (0-0.19): Red - Very low confidence, requires human review
 */
export function ConfidenceBadge({ 
  score, 
  showLabel = true,
  size = "md",
  className 
}: ConfidenceBadgeProps) {
  // Handle null/undefined scores
  const confidenceScore = score ?? 0.5;
  const percentage = Math.round(confidenceScore * 100);
  
  // Determine confidence level and styling
  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return { 
      level: "high", 
      label: "High Confidence",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-700 dark:text-green-400",
      borderColor: "border-green-200 dark:border-green-800",
      dotColor: "bg-green-500"
    };
    if (score >= 0.5) return { 
      level: "medium", 
      label: "Medium Confidence",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      textColor: "text-amber-700 dark:text-amber-400",
      borderColor: "border-amber-200 dark:border-amber-800",
      dotColor: "bg-amber-500"
    };
    if (score >= 0.2) return { 
      level: "low", 
      label: "Low Confidence",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      textColor: "text-orange-700 dark:text-orange-400",
      borderColor: "border-orange-200 dark:border-orange-800",
      dotColor: "bg-orange-500"
    };
    return { 
      level: "very-low", 
      label: "Needs Review",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      textColor: "text-red-700 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800",
      dotColor: "bg-red-500"
    };
  };

  const { level, label, bgColor, textColor, borderColor, dotColor } = getConfidenceLevel(confidenceScore);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const dotSizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5"
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        bgColor,
        textColor,
        borderColor,
        sizeClasses[size],
        className
      )}
      title={`${label}: ${percentage}%`}
    >
      <span className={cn("rounded-full", dotColor, dotSizeClasses[size])} />
      <span>{percentage}%</span>
      {showLabel && <span className="opacity-75">confidence</span>}
    </div>
  );
}

/**
 * ConfidenceBar - Visual progress bar for confidence display
 */
export function ConfidenceBar({ 
  score, 
  className 
}: { 
  score: number | null | undefined;
  className?: string;
}) {
  const confidenceScore = score ?? 0.5;
  const percentage = Math.round(confidenceScore * 100);

  const getBarColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.5) return "bg-amber-500";
    if (score >= 0.2) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Confidence</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-300", getBarColor(confidenceScore))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
