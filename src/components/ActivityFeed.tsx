import React from 'react';

export type ActivityType = 'task_started' | 'task_completed' | 'error' | 'status_change' | 'log';

export interface ActivityItem {
  id: string;
  timestamp: Date;
  type: ActivityType;
  agentId: string;
  agentName: string;
  message: string;
  details?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxHeight?: string;
}

const activityTypeConfig = {
  task_started: {
    icon: '▶',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  task_completed: {
    icon: '✓',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  error: {
    icon: '✕',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
  status_change: {
    icon: '●',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  log: {
    icon: '—',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/5',
  },
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities,
  maxHeight = 'max-h-[600px]'
}) => {
  return (
    <div className={`${maxHeight} overflow-y-auto space-y-2 p-4`}>
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 pb-2 mb-2 border-b border-gray-800">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
          Activity Feed
        </h2>
      </div>

      {/* Activity Items */}
      {activities.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No activity yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => {
            const config = activityTypeConfig[activity.type];
            
            return (
              <div
                key={activity.id}
                className={`
                  p-3 rounded-lg border border-gray-800
                  ${config.bgColor}
                  hover:bg-opacity-20 transition-all duration-150
                `}
              >
                {/* Header Row */}
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <span className={`${config.color} font-mono text-sm mt-0.5`}>
                    {config.icon}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Agent Name & Time */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-gray-300 text-sm font-medium truncate">
                        {activity.agentName}
                      </span>
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {activity.message}
                    </p>

                    {/* Details */}
                    {activity.details && (
                      <pre className="mt-2 p-2 bg-gray-950 rounded text-xs text-gray-500 font-mono overflow-x-auto">
                        {activity.details}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
