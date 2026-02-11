"use client";

import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  score: number; // 0-100
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Confidence thresholds for trust calibration
function getConfidenceLevel(score: number): {
  label: string;
  bgColor: string;
  textColor: string;
  barColor: string;
} {
  if (score >= 80) {
    return {
      label: "High",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-700 dark:text-green-300",
      barColor: "bg-green-500",
    };
  }
  if (score >= 60) {
    return {
      label: "Medium",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      textColor: "text-blue-700 dark:text-blue-300",
      barColor: "bg-blue-500",
    };
  }
  if (score >= 40) {
    return {
      label: "Low",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      textColor: "text-amber-700 dark:text-amber-300",
      barColor: "bg-amber-500",
    };
  }
  return {
    label: "Very Low",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300",
    barColor: "bg-red-500",
  };
}

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
  lg: "px-2.5 py-1 text-sm",
};

const barSizeClasses = {
  sm: "h-1 w-8",
  md: "h-1.5 w-12",
  lg: "h-2 w-16",
};

export function ConfidenceBadge({
  score,
  showLabel = true,
  size = "md",
  className,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        sizeClasses[size],
        level.bgColor,
        level.textColor,
        className
      )}
      title={`Confidence: ${clampedScore}%`}
    >
      {/* Mini progress bar */}
      <span
        className={cn(
          "relative overflow-hidden rounded-full bg-black/10 dark:bg-white/10",
          barSizeClasses[size]
        )}
      >
        <span
          className={cn("absolute inset-y-0 left-0 rounded-full", level.barColor)}
          style={{ width: `${clampedScore}%` }}
        />
      </span>
      {showLabel && <span>{level.label}</span>}
      <span className="tabular-nums">{clampedScore}%</span>
    </span>
  );
}
