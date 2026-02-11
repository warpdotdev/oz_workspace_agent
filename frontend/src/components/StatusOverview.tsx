interface StatusOverviewProps {
  overview: {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    errorAgents: number;
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
  };
}

export function StatusOverview({ overview }: StatusOverviewProps) {
  const agentStats = [
    {
      label: 'Total Agents',
      value: overview.totalAgents,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
    },
    {
      label: 'Active',
      value: overview.activeAgents,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: '🔵',
    },
    {
      label: 'Idle',
      value: overview.idleAgents,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: '⚫',
    },
    {
      label: 'Errors',
      value: overview.errorAgents,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: '🔴',
    },
  ];

  const taskStats = [
    {
      label: 'Total Tasks',
      value: overview.totalTasks,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
    },
    {
      label: 'Running',
      value: overview.runningTasks,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: '⚡',
    },
    {
      label: 'Completed',
      value: overview.completedTasks,
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: '✅',
    },
    {
      label: 'Failed',
      value: overview.failedTasks,
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: '❌',
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
      
      {/* Agent Stats */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Agents</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {agentStats.map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bgColor} rounded-lg p-4 border border-gray-200`}
            >
              <div className="flex items-center gap-2 mb-2">
                {stat.icon && <span className="text-lg">{stat.icon}</span>}
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Task Stats */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Tasks</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {taskStats.map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bgColor} rounded-lg p-4 border border-gray-200`}
            >
              <div className="flex items-center gap-2 mb-2">
                {stat.icon && <span className="text-lg">{stat.icon}</span>}
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
