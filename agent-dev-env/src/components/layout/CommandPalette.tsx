import { useEffect } from "react";
import { Command } from "cmdk";
import {
  Bot,
  FileEdit,
  Calendar,
  Shield,
  Server,
  Activity,
  Settings,
  Search,
} from "lucide-react";
import { useAppStore } from "../../store/appStore";
import type { TabId } from "../../types";

export function CommandPalette() {
  const open = useAppStore((s) => s.commandPaletteOpen);
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const agents = useAppStore((s) => s.agents);
  const setSelectedAgentId = useAppStore((s) => s.setSelectedAgentId);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  if (!open) return null;

  const navigateToTab = (tab: TabId) => {
    setActiveTab(tab);
    setOpen(false);
  };

  const selectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-base/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command Dialog */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Command className="bg-panel border border-border rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 border-b border-border-subtle">
            <Search size={16} className="text-text-tertiary shrink-0" />
            <Command.Input
              placeholder="Type a command or search..."
              className="w-full h-11 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
              autoFocus
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-1.5">
            <Command.Empty className="py-6 text-center text-sm text-text-tertiary">
              No results found.
            </Command.Empty>

            <Command.Group
              heading="Agents"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary"
            >
              {agents.map((agent) => (
                <Command.Item
                  key={agent.id}
                  value={agent.name}
                  onSelect={() => selectAgent(agent.id)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-text-secondary cursor-pointer data-[selected=true]:bg-surface data-[selected=true]:text-text-primary"
                >
                  <Bot size={14} />
                  <span>{agent.name}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-border-subtle" />

            <Command.Group
              heading="Navigate"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary"
            >
              {([
                { id: "editor" as TabId, label: "Editor", icon: FileEdit },
                { id: "schedule" as TabId, label: "Schedule", icon: Calendar },
                { id: "identity" as TabId, label: "Identity & Access", icon: Shield },
                { id: "environments" as TabId, label: "Environments", icon: Server },
                { id: "observe" as TabId, label: "Observability", icon: Activity },
              ]).map((item) => {
                const Icon = item.icon;
                return (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => navigateToTab(item.id)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-text-secondary cursor-pointer data-[selected=true]:bg-surface data-[selected=true]:text-text-primary"
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-border-subtle" />

            <Command.Group
              heading="Settings"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-tertiary"
            >
              <Command.Item
                value="Settings"
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-text-secondary cursor-pointer data-[selected=true]:bg-surface data-[selected=true]:text-text-primary"
              >
                <Settings size={14} />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
