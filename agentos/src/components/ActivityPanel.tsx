import { useAgentStore } from '../store';
import type { ActivityEventType } from '../types';

// Event type styling
const eventStyles: Record<ActivityEventType, { icon: string; color: string }> = {
  status_change: { icon: '🔄', color: 'text-text-secondary' },
  thought: { icon: '💭', color: 'text-accent-primary' },
  task_started: { icon: '▶️', color: 'text-status-running' },
  task_completed: { icon: '✅', color: 'text-status-running' },
  error: { icon: '❌', color: 'text-status-error' },
  warning: { icon: '⚠️', color: 'text-yellow-500' },
  info: { icon: 'ℹ️', color: 'text-status-paused' },
};

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function ActivityPanel() {
  const { activities } = useAgentStore();

  return (
    <aside className="w-80 flex-shrink-0 bg-bg-secondary border-l border-border-primary flex flex-col pt-8">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-primary">
        <h2 className="text-sm font-semibold text-text-primary">Activity Feed</h2>
        <p className="text-xs text-text-muted mt-0.5">Real-time agent events</p>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm text-text-muted">No activity yet</p>
            <p className="text-xs text-text-muted mt-1">
              Agent events will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-primary">
            {activities.map((activity) => {
              const style = eventStyles[activity.type];
              return (
                <div key={activity.id} className="px-4 py-3 hover:bg-bg-tertiary transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-text-secondary">
                          {activity.agentName}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm mt-0.5 ${style.color}`}>
                        {activity.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border-primary">
        <button className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors">
          Clear all activity
        </button>
      </div>
    </aside>
  );
}
