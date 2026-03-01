import { Bot, FileText, Plus } from "lucide-react";
import { Button } from "../ui/Button";
import { useAppStore } from "../../store/appStore";

/** Shown in main area when no agent is selected */
export function NoAgentSelected() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
        <Bot size={32} strokeWidth={1} className="text-text-disabled" />
      </div>
      <div className="text-center">
        <p className="text-text-secondary font-medium text-base">
          No Agent Selected
        </p>
        <p className="text-sm mt-1 max-w-[280px]">
          Select an agent from the sidebar to start working, or create a new
          one.
        </p>
      </div>
    </div>
  );
}

/** Shown in main area when there are no agents at all */
export function NoAgentsCreated() {
  const setCreateAgentModalOpen = useAppStore(
    (s) => s.setCreateAgentModalOpen
  );

  return (
    <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
        <Bot size={32} strokeWidth={1} className="text-text-disabled" />
      </div>
      <div className="text-center">
        <p className="text-text-secondary font-medium text-base">
          No Agents Yet
        </p>
        <p className="text-sm mt-1 max-w-[280px]">
          Create your first agent to get started with the development
          environment.
        </p>
      </div>
      <Button onClick={() => setCreateAgentModalOpen(true)}>
        <Plus size={14} />
        Create Agent
      </Button>
    </div>
  );
}

/** Shown in editor tab when no file is selected */
export function NoFileSelected() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-3">
      <FileText size={48} strokeWidth={1} className="text-border" />
      <div className="text-center">
        <p className="text-text-secondary font-medium">Markdown Editor</p>
        <p className="text-sm mt-1">
          Select a file from the sidebar to start editing
        </p>
      </div>
    </div>
  );
}
