import { useEffect, useState } from 'react';
import { useAgentStore } from './store';
import type { AgentEvent } from './types';

// Check if we're in Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Lazy load Tauri API only when in Tauri environment
const getTauriApi = async () => {
  if (!isTauri) return null;
  return import('./lib/tauri');
};

function App() {
  const { agents, events, setAgents, addEvent, setLoading, setError } = useAgentStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const api = await getTauriApi();
      if (api) {
        const loadedAgents = await api.getAgents();
        setAgents(loadedAgents);
        const loadedEvents = await api.getEvents(50);
        loadedEvents.forEach((event: AgentEvent) => addEvent(event));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const api = await getTauriApi();
      if (api) {
        const seededAgents = await api.seedMockData();
        setAgents(seededAgents);
        const loadedEvents = await api.getEvents(50);
        loadedEvents.forEach((event: AgentEvent) => addEvent(event));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDispatchTask = async () => {
    if (!selectedAgentId || !taskInput.trim()) return;
    
    try {
      const api = await getTauriApi();
      if (api) {
        await api.dispatchTask({
          agentId: selectedAgentId,
          instruction: taskInput,
        });
        setTaskInput('');
        // Reload events to show the new activity
        const loadedEvents = await api.getEvents(50);
        loadedEvents.forEach((event: AgentEvent) => addEvent(event));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch task');
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'paused': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'thought': return '💭';
      case 'action': return '⚡';
      case 'error': return '❌';
      case 'task_complete': return '✅';
      case 'status_change': return '🔄';
      default: return '📝';
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      {/* Sidebar - Agent List */}
      <aside className="w-60 border-r border-[var(--border-default)] bg-[var(--bg-secondary)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-default)]">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">AgentOS</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Mission Control for AI Agents</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-tertiary)] mb-4">No agents yet</p>
              <button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="px-3 py-2 text-sm bg-[var(--accent-primary)] text-white rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {isSeeding ? 'Seeding...' : 'Add Demo Agents'}
              </button>
            </div>
          ) : (
            <ul className="space-y-1">
              {agents.map((agent) => (
                <li key={agent.id}>
                  <button
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedAgentId === agent.id
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                      <span className="text-sm font-medium truncate">{agent.config.name}</span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
                      {agent.config.framework}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedAgent ? (
          <>
            {/* Agent Header */}
            <header className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                    {selectedAgent.config.name}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {selectedAgent.config.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAgent.status)} text-white`}>
                    {selectedAgent.status}
                  </span>
                </div>
              </div>
              
              {/* Task Dispatch */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDispatchTask()}
                  placeholder="Dispatch a task to this agent..."
                  className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  onClick={handleDispatchTask}
                  disabled={!taskInput.trim()}
                  className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-md hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </header>

            {/* Agent Details */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-default)]">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Framework</p>
                  <p className="text-sm text-[var(--text-primary)]">{selectedAgent.config.framework}</p>
                </div>
                <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-default)]">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Model</p>
                  <p className="text-sm text-[var(--text-primary)]">{selectedAgent.config.model}</p>
                </div>
                <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-default)]">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Tokens Used</p>
                  <p className="text-sm text-[var(--text-primary)]">{selectedAgent.tokensUsed.toLocaleString()}</p>
                </div>
                <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-default)]">
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">Runtime</p>
                  <p className="text-sm text-[var(--text-primary)]">{selectedAgent.runtime}s</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[var(--text-tertiary)]">Select an agent to view details</p>
            </div>
          </div>
        )}
      </main>

      {/* Activity Panel */}
      <aside className="w-80 border-l border-[var(--border-default)] bg-[var(--bg-secondary)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-default)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Activity Feed</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {events.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
              No activity yet
            </p>
          ) : (
            <ul className="space-y-2">
              {events.slice(0, 20).map((event) => (
                <li
                  key={event.id}
                  className="p-3 bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-default)]"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        {event.agentName}
                      </p>
                      <p className="text-sm text-[var(--text-primary)] mt-1">
                        {event.message}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

export default App;
