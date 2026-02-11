import { ErrorSummary } from '@/lib/api';

interface ErrorAlertsProps {
  errors: ErrorSummary[];
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function ErrorAlerts({ errors }: ErrorAlertsProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-red-200 bg-red-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔴</span>
          <div>
            <h2 className="text-lg font-semibold text-red-900">Error Alerts</h2>
            <p className="text-sm text-red-700 mt-1">
              {errors.length} agent{errors.length !== 1 ? 's' : ''} reporting errors
            </p>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-red-200">
        {errors.map((error) => (
          <div key={error.agentId} className="p-4 bg-white hover:bg-red-50 transition">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{error.agentName}</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                  {error.errorCount} error{error.errorCount !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatTimestamp(error.lastErrorTime)}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-3">{error.lastError}</p>
            
            <div className="flex items-center gap-3">
              <a
                href={`/agents/${error.agentId}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Agent Details →
              </a>
              <a
                href={`/monitoring?agentId=${error.agentId}&level=ERROR`}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                View Error History
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
