import { useState } from 'react';
import './App.css';
import { useAgentStore, useSelectedAgent } from './store/agentStore';
import { useSimulation } from './hooks/useSimulation';
import { PerformanceChart } from './components/PerformanceChart';
import { formatUptime } from './services/mockAgentService';
import type { AgentStatus, ActivityType } from './types';

// Status color mapping
const getStatusColor = (status: AgentStatus) => {
  switch (status) {
    case 'running': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    case 'idle': return 'bg-gray-500';
    case 'paused': return 'bg-blue-500';
  }
};

const getStatusTextColor = (status: AgentStatus) => {
  switch (status) {
    case 'running': return 'text-green-400';
    case 'error': return 'text-red-400';
    case 'idle': return 'text-gray-400';
    case 'paused': return 'text-blue-400';
  }
};

// Activity type color mapping
const getActivityTypeColor = (type: ActivityType) => {
  switch (type) {
    case 'success': return 'text-green-400';
    case 'error': return 'text-red-400';
    case 'warning': return 'text-yellow-400';
    case 'info': return 'text-blue-400';
    case 'thought': return 'text-purple-400';
    case 'task': return 'text-cyan-400';
  }
};

const getActivityTypeIcon = (type: ActivityType) => {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '⚠';
    case 'info': return 'ℹ';
    case 'thought': return '💭';
    case 'task': return '📋';
  }
};

function App() {
  // Use Zustand store
  const { 
    agents, 
    activities, 
    selectedAgentId, 
    setSelectedAgent,
    updateAgentStatus,
    dispatchTask,
    clearActivities,
  } = useAgentStore();

  const selectedAgent = useSelectedAgent();

  // Auto-start simulation
  const { isRunning, toggle } = useSimulation(true);

  // Task input state
  const [taskInput, setTaskInput] = useState('');

  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Handle task dispatch
  const handleDispatchTask = () => {
    if (taskInput.trim() && selectedAgentId) {
      dispatchTask(selectedAgentId, taskInput.trim());
      setTaskInput('');
    }
  };

  // Handle agent control buttons
  const handleStart = () => {
    if (selectedAgentId) {
      updateAgentStatus(selectedAgentId, 'running');
    }
  };

  const handleStop = () => {
    if (selectedAgentId) {
      updateAgentStatus(selectedAgentId, 'idle');
    }
  };

  const handlePause = () => {
    if (selectedAgentId) {
      updateAgentStatus(selectedAgentId, 'paused');
    }
  };

  // Filter activities for selected agent or show all
  const filteredActivities = selectedAgentId 
    ? activities.filter(a => a.agentId === selectedAgentId)
    : activities;

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Left Panel - Agent List Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-semibold">Agent Control</h1>
          <p className="text-xs text-gray-400 mt-1">Mission Control for AI Teams</p>
        </div>
        
        {/* Simulation Toggle */}
        <div className="px-4 py-2 border-b border-gray-800">
          <button
            onClick={toggle}
            className={`w-full px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              isRunning 
                ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {isRunning ? '● Simulation Running' : '○ Start Simulation'}
          </button>
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
                  selectedAgentId === agent.id
                    ? 'bg-gray-800 border border-gray-700'
                    : 'hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{agent.name}</span>
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)} ${
                    agent.status === 'running' ? 'animate-pulse' : ''
                  }`} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{agent.lastActivity}</span>
                  <span className={`text-xs capitalize ${getStatusTextColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>
                {agent.currentTask && (
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {agent.currentTask}
                  </div>
                )}
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
              {selectedAgent?.name || 'Select an agent'}
            </h2>
            {selectedAgent && (
              <span className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedAgent.status)} ${
                  selectedAgent.status === 'running' ? 'animate-pulse' : ''
                }`} />
                <span className={`text-sm capitalize ${getStatusTextColor(selectedAgent.status)}`}>
                  {selectedAgent.status}
                </span>
              </span>
            )}
          </div>
          
          {selectedAgent && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={handlePause}
                disabled={selectedAgent.status === 'paused'}
                className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pause
              </button>
              <button 
                onClick={handleStop}
                disabled={selectedAgent.status === 'idle'}
                className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Stop
              </button>
              <button 
                onClick={handleStart}
                disabled={selectedAgent.status === 'running'}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedAgent ? (
            <div className="space-y-6">
              {/* Agent Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400">Tasks Completed</div>
                  <div className="text-2xl font-semibold mt-1">{selectedAgent.tasksCompleted}</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400">Runtime</div>
                  <div className="text-2xl font-semibold mt-1">{formatUptime(selectedAgent.runtime)}</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400">Success Rate</div>
                  <div className="text-2xl font-semibold mt-1">{selectedAgent.successRate}%</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="text-sm text-gray-400">Token Usage</div>
                  <div className="text-2xl font-semibold mt-1">{selectedAgent.tokenUsage.toLocaleString()}</div>
                </div>
              </div>

              {/* Performance Chart */}
              <PerformanceChart agentId={selectedAgent.id} />

              {/* Recent Logs */}
              <div className="bg-gray-900 rounded-lg border border-gray-800">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="font-semibold">Recent Logs</h3>
                  <span className="text-xs text-gray-400">
                    {filteredActivities.length} entries
                  </span>
                </div>
                <div className="p-4 font-mono text-sm space-y-2 max-h-48 overflow-y-auto">
                  {filteredActivities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-2">
                      <span className="text-gray-500 shrink-0">
                        [{formatTimestamp(activity.timestamp)}]
                      </span>
                      <span className={getActivityTypeColor(activity.type)}>
                        {getActivityTypeIcon(activity.type)}
                      </span>
                      <span className={getActivityTypeColor(activity.type)}>
                        {activity.message}
                      </span>
                    </div>
                  ))}
                  {filteredActivities.length === 0 && (
                    <div className="text-gray-500">No recent activity</div>
                  )}
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
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDispatchTask()}
                    placeholder="Enter task instructions... (Press Enter to send)"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Press ⌘+K for quick commands
                    </span>
                    <button 
                      onClick={handleDispatchTask}
                      disabled={!taskInput.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Activity Feed</h3>
            <p className="text-xs text-gray-400 mt-1">
              {isRunning ? 'Real-time updates' : 'Simulation paused'}
            </p>
          </div>
          <button
            onClick={clearActivities}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
        
        {/* Activity List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activities.slice(0, 50).map((activity) => {
            const agent = agents.find(a => a.id === activity.agentId);
            return (
              <div
                key={activity.id}
                className={`rounded-lg p-3 border transition-colors cursor-pointer ${
                  activity.agentId === selectedAgentId
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-800/50 border-gray-800 hover:border-gray-700'
                }`}
                onClick={() => setSelectedAgent(activity.agentId)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(agent?.status || 'idle')}`} />
                    <span className="text-sm font-medium">{agent?.name || 'Unknown'}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className={getActivityTypeColor(activity.type)}>
                    {getActivityTypeIcon(activity.type)}
                  </span>
                  <p className={`text-sm ${getActivityTypeColor(activity.type)}`}>
                    {activity.message}
                  </p>
                </div>
                {activity.details && (
                  <p className="text-xs text-gray-500 mt-1 ml-5">
                    {activity.details}
                  </p>
                )}
              </div>
            );
          })}
          {activities.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No activity yet
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="p-4 border-t border-gray-800">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-gray-400">
              Total Events: <span className="text-gray-200">{activities.length}</span>
            </div>
            <div className="text-gray-400">
              Running: <span className="text-green-400">{agents.filter(a => a.status === 'running').length}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
