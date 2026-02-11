import { useState, useEffect, useRef } from 'react';
import { useAgentStore } from '../store';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
}

export default function CommandBar() {
  const { toggleCommandBar } = useAgentStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Available commands
  const commands: Command[] = [
    {
      id: 'new-agent',
      label: 'Create New Agent',
      description: 'Launch a new AI agent',
      icon: '🤖',
      action: () => {
        console.log('Creating new agent...');
        toggleCommandBar();
      },
    },
    {
      id: 'dispatch-task',
      label: 'Dispatch Task',
      description: 'Send a task to an agent',
      icon: '📋',
      action: () => {
        console.log('Dispatching task...');
        toggleCommandBar();
      },
    },
    {
      id: 'pause-all',
      label: 'Pause All Agents',
      description: 'Pause all running agents',
      icon: '⏸️',
      action: () => {
        console.log('Pausing all agents...');
        toggleCommandBar();
      },
    },
    {
      id: 'resume-all',
      label: 'Resume All Agents',
      description: 'Resume all paused agents',
      icon: '▶️',
      action: () => {
        console.log('Resuming all agents...');
        toggleCommandBar();
      },
    },
    {
      id: 'view-logs',
      label: 'View System Logs',
      description: 'Open detailed system logs',
      icon: '📜',
      action: () => {
        console.log('Opening logs...');
        toggleCommandBar();
      },
    },
    {
      id: 'settings',
      label: 'Open Settings',
      description: 'Configure AgentOS preferences',
      icon: '⚙️',
      action: () => {
        console.log('Opening settings...');
        toggleCommandBar();
      },
    },
  ];

  // Filter commands based on query
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={toggleCommandBar}
      />
      
      {/* Command palette */}
      <div className="relative w-full max-w-xl bg-bg-secondary border border-border-primary rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center px-4 border-b border-border-primary">
          <span className="text-text-muted">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 px-3 py-4 bg-transparent text-text-primary placeholder-text-muted outline-none text-sm"
          />
          <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-xs text-text-muted">ESC</kbd>
        </div>

        {/* Commands list */}
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-muted text-sm">
              No commands found
            </div>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                    ${index === selectedIndex 
                      ? 'bg-bg-elevated text-text-primary' 
                      : 'text-text-secondary hover:bg-bg-tertiary'
                    }`}
                >
                  <span className="text-lg">{cmd.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{cmd.label}</div>
                    <div className="text-xs text-text-muted">{cmd.description}</div>
                  </div>
                  {index === selectedIndex && (
                    <span className="text-xs text-text-muted">↵</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border-primary flex items-center gap-4 text-xs text-text-muted">
          <span><kbd className="px-1 py-0.5 bg-bg-tertiary rounded">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 bg-bg-tertiary rounded">↵</kbd> Select</span>
          <span><kbd className="px-1 py-0.5 bg-bg-tertiary rounded">ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
