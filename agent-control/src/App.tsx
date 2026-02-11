import { useState } from "react";
import "./App.css";

type AgentStatus = 'running' | 'error' | 'idle' | 'paused';

interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  lastActivity: string;
}

interface Activity {
  id: string;
  agentId: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

function App() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>('agent-1');
  
  // Mock data - will be replaced with real data from backend
  const agents: Agent[] = [
    { id: 'agent-1', name: 'Data Processor', status: 'running', lastActivity: '2 min ago' },
    { id: 'agent-2', name: 'Report Generator', status: 'idle', lastActivity: '15 min ago' },
    { id: 'agent-3', name: 'API Monitor', status: 'paused', lastActivity: '1 hour ago' },
  ];

  const activities: Activity[] = [
    { id: '1', agentId: 'agent-1', message: 'Processing batch 47/100', timestamp: '10:45 AM', type: 'info' },
    { id: '2', agentId: 'agent-1', message: 'Successfully completed task', timestamp: '10:43 AM', type: 'success' },
    { id: '3', agentId: 'agent-2', message: 'Waiting for input', timestamp: '10:30 AM', type: 'warning' },
  ];

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'running': return 'bg-status-running';
      case 'error': return 'bg-status-error';
      case 'idle': return 'bg-gray-500';
      case 'paused': return 'bg-status-paused';
    }
  };

  const getActivityTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Left Panel - Agent List Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-semibold">Agent Control</h1>
          <p className="text-xs text-gray-400 mt-1">Mission Control</p>
        </div>
        
        {/* Agent List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
              Active Agents ({agents.length})
            </div>
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  selectedAgent === agent.id
                    ? 'bg-gray-800 border border-gray-700'
                    : 'hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{agent.name}</span>
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                </div>
                <div className="text-xs text-gray-400">{agent.lastActivity}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
            + New Agent
          </button>
        </div>
      </aside>

      {/* Center Panel - Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">
              {agents.find(a => a.id === selectedAgent)?.name || 'Select an agent'}
            </h2>
            {selectedAgent && (
              <span className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(
                  agents.find(a => a.id === selectedAgent)?.status || 'idle'
                )}`} />
                <span className="text-sm text-gray-400 capitalize">
                  {agents.find(a => a.id === selectedAgent)?.status}
                </span>
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors">
              Configure
            </button>
            <button className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors">
              Stop
            </button>
            <button className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors">
              Start
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedAgent ? (
            <div className="space-y-6">
              {/* Agent Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400">Tasks Completed</div>
                  <div className="text-2xl font-semibold mt-1">47</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400">Uptime</div>
                  <div className="text-2xl font-semibold mt-1">4h 23m</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400">Success Rate</div>
                  <div className="text-2xl font-semibold mt-1">98%</div>
                </div>
              </div>

              {/* Recent Logs */}
              <div className="bg-gray-900 rounded-lg border border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="font-semibold">Recent Logs</h3>
                </div>
                <div className="p-4 font-mono text-sm space-y-2">
                  <div className="text-gray-400">[10:45:12] Processing batch 47/100...</div>
                  <div className="text-green-400">[10:43:45] Task completed successfully</div>
                  <div className="text-blue-400">[10:42:30] Fetching new data from API</div>
                  <div className="text-gray-400">[10:41:15] Agent initialized</div>
                </div>
              </div>

              {/* Task Dispatch */}
              <div className="bg-gray-900 rounded-lg border border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="font-semibold">Dispatch Task</h3>
                </div>
                <div className="p-4">
                  <input
                    type="text"
                    placeholder="Enter task instructions... (Press Cmd+K for quick commands)"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <div className="mt-3 flex justify-end">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
                      Send Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select an agent to view details
            </div>
          )}
        </div>
      </main>

      {/* Right Panel - Activity Feed */}
      <aside className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-semibold">Activity Feed</h3>
          <p className="text-xs text-gray-400 mt-1">Real-time updates</p>
        </div>
        
        {/* Activity List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activities.map((activity) => {
            const agent = agents.find(a => a.id === activity.agentId);
            return (
              <div
                key={activity.id}
                className="bg-gray-800/50 rounded-lg p-3 border border-gray-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium">{agent?.name}</span>
                  <span className="text-xs text-gray-500">{activity.timestamp}</span>
                </div>
                <p className={`text-sm ${getActivityTypeColor(activity.type)}`}>
                  {activity.message}
                </p>
              </div>
            );
          })}
        </div>

        {/* Clear Button */}
        <div className="p-4 border-t border-gray-800">
          <button className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            Clear Activity
          </button>
        </div>
      </aside>
    </div>
  );
}

export default App;
