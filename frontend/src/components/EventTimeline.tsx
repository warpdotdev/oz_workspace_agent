import { Event, EventLevel, AgentStatus } from '@/lib/api';

interface EventTimelineProps {
  events: Event[];
}

function getEventLevelColor(level: EventLevel): string {
  switch (level) {
    case EventLevel.DEBUG:
      return 'bg-gray-100 text-gray-700 border-gray-300';
    case EventLevel.INFO:
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case EventLevel.WARNING:
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case EventLevel.ERROR:
      return 'bg-red-100 text-red-700 border-red-300';
    case EventLevel.CRITICAL:
      return 'bg-red-200 text-red-900 border-red-500';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

function getStatusColor(status: AgentStatus): string {
  switch (status) {
    case AgentStatus.IDLE:
      return 'text-gray-600';
    case AgentStatus.RUNNING:
      return 'text-blue-600';
    case AgentStatus.PAUSED:
      return 'text-amber-600';
    case AgentStatus.ERROR:
      return 'text-red-600';
    case AgentStatus.COMPLETED:
      return 'text-green-600';
    default:
      return 'text-gray-600';
  }
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

export function EventTimeline({ events }: EventTimelineProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
        <p className="text-sm text-gray-600 mt-1">Live activity feed from all agents</p>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No events recorded yet
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    event.level === EventLevel.ERROR || event.level === EventLevel.CRITICAL
                      ? 'bg-red-500'
                      : event.level === EventLevel.WARNING
                      ? 'bg-amber-500'
                      : event.level === EventLevel.INFO
                      ? 'bg-blue-500'
                      : 'bg-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getEventLevelColor(event.level)}`}>
                      {event.level}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-2">{event.message}</p>
                  
                  {event.agent && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>Agent:</span>
                      <span className="font-medium">{event.agent.name}</span>
                      <span className={`${getStatusColor(event.agent.status)}`}>
                        ({event.agent.status})
                      </span>
                    </div>
                  )}
                  
                  {event.task && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                      <span>Task:</span>
                      <span className="font-medium">{event.task.title}</span>
                      <span>({event.task.status})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
