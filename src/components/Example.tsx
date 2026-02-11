import React, { useState } from 'react';
import { AgentStatusCard, ActivityFeed, CommandBar, useCommandBar } from './index';
import type { Agent, ActivityItem, Command } from './index';

/**
 * Example usage of all UI components together
 * This demonstrates the three-panel layout mentioned in the design specs
 */
export const ExampleApp: React.FC = () => {
  const commandBar = useCommandBar();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('agent-1');

  // Mock agent data
  const agents: Agent[] = [
    {
      id: 'agent-1',
      name: 'Data Processor',
      status: 'running',
      lastActivity: '2m ago',
      tasksCompleted: 15,
      description: 'Processing customer data and generating reports',
    },
    {
      id: 'agent-2',
      name: 'API Monitor',
      status: 'idle',
      lastActivity: '15m ago',
      tasksCompleted: 42,
      description: 'Monitoring API endpoints for errors and performance',
    },
    {
      id: 'agent-3',
      name: 'Email Handler',
      status: 'paused',
      lastActivity: '1h ago',
      tasksCompleted: 8,
      description: 'Processing incoming emails and categorizing them',
    },
    {
      id: 'agent-4',
      name: 'Database Backup',
      status: 'error',
      lastActivity: '5m ago',
      tasksCompleted: 3,
      description: 'Automated database backup and verification',
    },
  ];

  // Mock activity data
  const activities: ActivityItem[] = [
    {
      id: 'activity-1',
      timestamp: new Date(Date.now() - 120000),
      type: 'task_completed',
      agentId: 'agent-1',
      agentName: 'Data Processor',
      message: 'Completed processing 1000 records',
      details: 'Success rate: 98.5%\nProcessing time: 2.3s',
    },
    {
      id: 'activity-2',
      timestamp: new Date(Date.now() - 300000),
      type: 'error',
      agentId: 'agent-4',
      agentName: 'Database Backup',
      message: 'Backup failed: Connection timeout',
      details: 'Error: Connection to backup server timed out after 30s',
    },
    {
      id: 'activity-3',
      timestamp: new Date(Date.now() - 600000),
      type: 'status_change',
      agentId: 'agent-2',
      agentName: 'API Monitor',
      message: 'Status changed from running to idle',
    },
    {
      id: 'activity-4',
      timestamp: new Date(Date.now() - 900000),
      type: 'task_started',
      agentId: 'agent-1',
      agentName: 'Data Processor',
      message: 'Started processing new batch of records',
    },
    {
      id: 'activity-5',
      timestamp: new Date(Date.now() - 1200000),
      type: 'log',
      agentId: 'agent-2',
      agentName: 'API Monitor',
      message: 'All API endpoints responding normally',
    },
  ];

  // Mock commands
  const commands: Command[] = [
    {
      id: 'cmd-1',
      label: 'Start Agent',
      description: 'Start the selected agent',
      category: 'Agent Control',
      icon: '▶',
      action: () => console.log('Starting agent:', selectedAgentId),
    },
    {
      id: 'cmd-2',
      label: 'Stop Agent',
      description: 'Stop the selected agent',
      category: 'Agent Control',
      icon: '■',
      action: () => console.log('Stopping agent:', selectedAgentId),
    },
    {
      id: 'cmd-3',
      label: 'Pause Agent',
      description: 'Pause the selected agent',
      category: 'Agent Control',
      icon: '⏸',
      action: () => console.log('Pausing agent:', selectedAgentId),
    },
    {
      id: 'cmd-4',
      label: 'Restart Agent',
      description: 'Restart the selected agent',
      category: 'Agent Control',
      icon: '↻',
      action: () => console.log('Restarting agent:', selectedAgentId),
    },
    {
      id: 'cmd-5',
      label: 'View Logs',
      description: 'Open detailed logs for the selected agent',
      category: 'Monitoring',
      icon: '📋',
      action: () => console.log('Viewing logs for:', selectedAgentId),
    },
    {
      id: 'cmd-6',
      label: 'View Metrics',
      description: 'Open performance metrics dashboard',
      category: 'Monitoring',
      icon: '📊',
      action: () => console.log('Viewing metrics for:', selectedAgentId),
    },
    {
      id: 'cmd-7',
      label: 'Create New Agent',
      description: 'Launch wizard to create a new agent',
      category: 'Management',
      icon: '➕',
      action: () => console.log('Creating new agent'),
    },
    {
      id: 'cmd-8',
      label: 'Settings',
      description: 'Open application settings',
      category: 'Management',
      icon: '⚙',
      action: () => console.log('Opening settings'),
    },
  ];

  return (
    <div className="h-screen bg-gray-950 flex flex-col">
      {/* Command Bar */}
      <CommandBar
        isOpen={commandBar.isOpen}
        onClose={commandBar.close}
        commands={commands}
        placeholder="Type a command or search..."
      />

      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center px-6">
        <h1 className="text-white text-xl font-semibold">AI Agent Manager</h1>
        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={commandBar.open}
            className="px-3 py-1.5 text-sm text-gray-400 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            <kbd className="font-mono">⌘K</kbd>
          </button>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Agent List */}
        <aside className="w-80 border-r border-gray-800 overflow-y-auto p-4">
          <div className="mb-4">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-3">
              Agents ({agents.length})
            </h2>
          </div>
          <div className="space-y-3">
            {agents.map((agent) => (
              <AgentStatusCard
                key={agent.id}
                agent={agent}
                onClick={() => setSelectedAgentId(agent.id)}
                isSelected={selectedAgentId === agent.id}
              />
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {selectedAgentId ? (
            <div>
              <h2 className="text-white text-2xl font-semibold mb-4">
                {agents.find((a) => a.id === selectedAgentId)?.name}
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Status</div>
                  <div className="text-white text-lg font-medium capitalize">
                    {agents.find((a) => a.id === selectedAgentId)?.status}
                  </div>
                </div>
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">Tasks Completed</div>
                  <div className="text-white text-lg font-medium">
                    {agents.find((a) => a.id === selectedAgentId)?.tasksCompleted}
                  </div>
                </div>
              </div>
              <div className="text-gray-400">
                <p>
                  {agents.find((a) => a.id === selectedAgentId)?.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-20">
              <p>Select an agent to view details</p>
            </div>
          )}
        </main>

        {/* Right Panel - Activity Feed */}
        <aside className="w-96 border-l border-gray-800 overflow-hidden">
          <ActivityFeed activities={activities} maxHeight="h-full" />
        </aside>
      </div>
    </div>
  );
};

export default ExampleApp;
