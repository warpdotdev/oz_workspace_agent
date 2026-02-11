'use client';

interface AgentStatsProps {
  successRate: number | null;
  totalRuns: number;
  avgLatency: number | null;
  className?: string;
}

export function AgentStats({ 
  successRate, 
  totalRuns, 
  avgLatency,
  className = ''
}: AgentStatsProps) {
  const formatLatency = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatSuccessRate = (rate: number | null): string => {
    if (rate === null) return 'N/A';
    return `${Math.round(rate * 100)}%`;
  };

  const getSuccessRateColor = (rate: number | null): string => {
    if (rate === null) return 'text-gray-500';
    if (rate >= 0.9) return 'text-green-600';
    if (rate >= 0.7) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {/* Success Rate */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <svg 
            className="w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span className="text-sm text-gray-500">Success Rate</span>
        </div>
        <p className={`text-2xl font-bold ${getSuccessRateColor(successRate)}`}>
          {formatSuccessRate(successRate)}
        </p>
        {successRate !== null && (
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${
                successRate >= 0.9 ? 'bg-green-500' : 
                successRate >= 0.7 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.round(successRate * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Total Runs */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <svg 
            className="w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
          <span className="text-sm text-gray-500">Total Runs</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {totalRuns.toLocaleString()}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          All time executions
        </p>
      </div>

      {/* Average Latency */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <svg 
            className="w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span className="text-sm text-gray-500">Avg Latency</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {formatLatency(avgLatency)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Average response time
        </p>
      </div>
    </div>
  );
}

// Compact version for card views
interface AgentStatsCompactProps {
  successRate: number | null;
  totalRuns: number;
  className?: string;
}

export function AgentStatsCompact({ 
  successRate, 
  totalRuns,
  className = ''
}: AgentStatsCompactProps) {
  const formatSuccessRate = (rate: number | null): string => {
    if (rate === null) return '-';
    return `${Math.round(rate * 100)}%`;
  };

  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        <svg 
          className="w-3.5 h-3.5 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 10V3L4 14h7v7l9-11h-7z" 
          />
        </svg>
        <span className="text-gray-600">{totalRuns} runs</span>
      </div>
      {successRate !== null && (
        <div className="flex items-center gap-1">
          <svg 
            className={`w-3.5 h-3.5 ${
              successRate >= 0.9 ? 'text-green-500' : 
              successRate >= 0.7 ? 'text-amber-500' : 'text-red-500'
            }`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span className={`${
            successRate >= 0.9 ? 'text-green-600' : 
            successRate >= 0.7 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {formatSuccessRate(successRate)}
          </span>
        </div>
      )}
    </div>
  );
}
