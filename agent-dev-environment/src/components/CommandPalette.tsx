import { Command } from "cmdk";
import { useEffect } from "react";
import { Bot, FileEdit, Clock, Shield, Server, Activity, Settings } from "lucide-react";
import { useAppStore } from "../store/appStore";
import type { TabId } from "../types";

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    agents,
    setSelectedAgent,
    setActiveTab,
  } = useAppStore();

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const navigateToTab = (tab: TabId) => {
    setActiveTab(tab);
    setCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Command dialog */}
      <Command
        className="relative w-[560px] max-h-[400px] bg-surface-raised border border-border-subtle rounded-lg shadow-dialog overflow-hidden animate-fade-in"
        label="Command palette"
      >
        <Command.Input
          placeholder="Type a command or search..."
          className="w-full px-4 py-3 text-sm text-text-primary bg-transparent border-b border-border-subtle outline-none placeholder:text-text-tertiary"
          autoFocus
        />
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-text-tertiary">
            No results found.
          </Command.Empty>

          <Command.Group heading="Agents" className="[&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            {agents.map((agent) => (
              <Command.Item
                key={agent.id}
                value={agent.name}
                onSelect={() => {
                  setSelectedAgent(agent);
                  setCommandPaletteOpen(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary rounded cursor-pointer data-[selected=true]:bg-surface-elevated data-[selected=true]:text-text-primary"
              >
                <Bot size={14} />
                {agent.name}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            <Command.Item
              value="Editor"
              onSelect={() => navigateToTab("editor")}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary rounded cursor-pointer data-[selected=true]:bg-surface-elevated data-[selected=true]:text-text-primary"
            >
              <FileEdit size={14} />
              Go to Editor
            </Command.Item>
            <Command.Item
              value="Schedule"
              onSelect={() => navigateToTab("schedule")}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary rounded cursor-pointer data-[selected=true]:bg-surface-elevated data-[selected=true]:text-text-primary"
            >
              <Clock size={14} />
              Go to Schedule
            </Command.Item>
            <Command.Item
              value="Identity"
              onSelect={() => navigateToTab("identity")}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary rounded cursor-pointer data-[selected=true]:bg-surface-elevated data-[selected=true]:text-text-primary"
            >
              <Shield size={14} />
              Go to Identity & Access
            </Command.Item>
            <Command.Item
              value="Environments"
              onSelect={() => navigateToTab("environments")}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary rounded cursor-pointer data-[selected=true]:bg-surface-elevated data-[selected=true]:text-text-primary"
            >
              <Server size={14} />
              Go to Environments
            </Command.Item>
            <Command.Item
              value="Observe"
              onSelect={() => navigateToTab("observe")}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary rounded cursor-pointer data-[selected=true]:bg-surface-elevated data-[selected=true]:text-text-primary"
            >
              <Activity size={14} />
              Go to Observability
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            <Command.Item
              value="Settings"
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary rounded cursor-pointer data-[selected=true]:bg-surface-elevated data-[selected=true]:text-text-primary"
            >
              <Settings size={14} />
              Open Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
