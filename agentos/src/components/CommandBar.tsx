import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/store/agentStore";
import { createMockAgent, generateMockActivity } from "@/lib/mockAgentService";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  shortcut?: string;
  category: "agent" | "task" | "system";
  action: () => void;
}

interface CommandBarProps {
  onOpenTaskDispatch?: () => void;
}

export function CommandBar({ onOpenTaskDispatch }: CommandBarProps) {
  const { isCommandBarOpen, setCommandBarOpen, agents, addAgent, updateAgent, addActivity, selectedAgentId } =
    useAgentStore();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: "add-agent",
      label: "Add New Agent",
      description: "Create a new AI agent",
      shortcut: "⌘N",
      category: "agent",
      action: () => {
        const newAgent = createMockAgent(agents.length);
        newAgent.status = "idle";
        addAgent(newAgent);
        setCommandBarOpen(false);
      },
    },
    {
      id: "dispatch-task",
      label: "Dispatch Task",
      description: "Open task dispatch panel to send a task to an agent",
      shortcut: "⌘D",
      category: "task",
      action: () => {
        setCommandBarOpen(false);
        if (onOpenTaskDispatch) {
          onOpenTaskDispatch();
        }
      },
    },
    {
      id: "pause-agent",
      label: "Pause Agent",
      description: "Pause the selected agent",
      shortcut: "⌘P",
      category: "agent",
      action: () => {
        if (selectedAgentId) {
          updateAgent(selectedAgentId, { status: "paused" });
        }
        setCommandBarOpen(false);
      },
    },
    {
      id: "resume-agent",
      label: "Resume Agent",
      description: "Resume the selected agent",
      shortcut: "⌘R",
      category: "agent",
      action: () => {
        if (selectedAgentId) {
          updateAgent(selectedAgentId, { status: "running" });
        }
        setCommandBarOpen(false);
      },
    },
    {
      id: "stop-agent",
      label: "Stop Agent",
      description: "Stop the selected agent completely",
      shortcut: "⌘S",
      category: "agent",
      action: () => {
        if (selectedAgentId) {
          updateAgent(selectedAgentId, { status: "idle", currentTask: null });
        }
        setCommandBarOpen(false);
      },
    },
    {
      id: "simulate-activity",
      label: "Simulate Activity",
      description: "Generate mock agent activity",
      category: "system",
      action: () => {
        const runningAgents = agents.filter((a) => a.status === "running");
        if (runningAgents.length > 0) {
          const agent = runningAgents[Math.floor(Math.random() * runningAgents.length)];
          addActivity(generateMockActivity(agent));
        }
        setCommandBarOpen(false);
      },
    },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isCommandBarOpen && inputRef.current) {
      inputRef.current.focus();
    }
    setSearch("");
    setSelectedIndex(0);
  }, [isCommandBarOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command bar with Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandBarOpen(!isCommandBarOpen);
        return;
      }

      if (!isCommandBarOpen) return;

      // Close with Escape
      if (e.key === "Escape") {
        setCommandBarOpen(false);
        return;
      }

      // Navigate with arrow keys
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }

      // Execute with Enter
      if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandBarOpen, filteredCommands, selectedIndex, setCommandBarOpen]);

  if (!isCommandBarOpen) return null;

  return (
    <div className="command-bar" onClick={() => setCommandBarOpen(false)}>
      <div
        className="command-bar-content animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <SearchIcon className="w-5 h-5 text-text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary outline-none"
          />
          <kbd className="px-2 py-0.5 text-xs bg-background-tertiary text-text-tertiary rounded">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-tertiary">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-surface-hover"
                    : "hover:bg-surface-hover"
                }`}
              >
                <CategoryIcon category={cmd.category} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary">{cmd.label}</div>
                  <div className="text-xs text-text-tertiary truncate">
                    {cmd.description}
                  </div>
                </div>
                {cmd.shortcut && (
                  <kbd className="px-2 py-0.5 text-xs bg-background-tertiary text-text-tertiary rounded flex-shrink-0">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-xs text-text-tertiary">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded">esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CategoryIcon({ category }: { category: "agent" | "task" | "system" }) {
  const className = "w-4 h-4 text-text-tertiary";
  
  switch (category) {
    case "agent":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </svg>
      );
    case "task":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "system":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
}
