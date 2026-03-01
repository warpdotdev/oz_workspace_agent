import { Sidebar } from "../sidebar/Sidebar";
import { MainContent } from "../main/MainContent";
import { RightPanel } from "../panels/RightPanel";
import { CommandPalette } from "./CommandPalette";
import { CreateAgentModal } from "../sidebar/CreateAgentModal";

export function AppLayout() {
  return (
    <>
      <div className="flex h-full w-full overflow-hidden">
        {/* Left: Sidebar */}
        <Sidebar />

        {/* Center: Main Content */}
        <MainContent />

        {/* Right: Context Panel */}
        <RightPanel />
      </div>

      {/* Overlays */}
      <CommandPalette />
      <CreateAgentModal />
    </>
  );
}
