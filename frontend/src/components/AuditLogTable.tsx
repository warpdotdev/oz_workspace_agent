import { AuditLog } from '@/lib/api';

interface AuditLogTableProps {
  logs: AuditLog[];
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

function getActionColor(action: string): string {
  if (action.includes('create') || action.includes('CREATE')) {
    return 'bg-green-100 text-green-700 border-green-300';
  }
  if (action.includes('delete') || action.includes('DELETE')) {
    return 'bg-red-100 text-red-700 border-red-300';
  }
  if (action.includes('update') || action.includes('UPDATE')) {
    return 'bg-blue-100 text-blue-700 border-blue-300';
  }
  return 'bg-gray-100 text-gray-700 border-gray-300';
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
        <p className="text-sm text-gray-600 mt-1">Recent user actions and changes</p>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No audit logs recorded yet
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {log.resource}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                <span>Resource ID:</span>
                <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                  {log.resourceId}
                </code>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>By:</span>
                <span className="font-medium">{log.user.name || log.user.email}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
