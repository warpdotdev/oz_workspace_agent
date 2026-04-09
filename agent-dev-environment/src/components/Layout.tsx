import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { RightPanel } from "./RightPanel";
import { CommandPalette } from "./CommandPalette";

export function Layout() {
  const { sidebarOpen, toggleSidebar, rightPanelOpen } = useAppStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-base">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-sidebar flex-shrink-0">
          <Sidebar />
        </aside>
      )}

      {/* Sidebar toggle (when collapsed) */}
      {!sidebarOpen && (
        <div className="flex-shrink-0 border-r border-border-subtle bg-surface-raised">
          <button
            onClick={toggleSidebar}
            className="p-2 m-1 text-text-tertiary hover:text-text-primary rounded hover:bg-surface-elevated transition-colors"
            title="Open sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 relative">
        {/* Sidebar collapse button (when sidebar is open) */}
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute top-3 left-2 z-10 p-1 text-text-tertiary hover:text-text-primary rounded hover:bg-surface-elevated transition-colors opacity-0 hover:opacity-100"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
        <MainContent />
      </main>

      {/* Right Panel */}
      {rightPanelOpen && (
        <aside className="w-right-panel flex-shrink-0">
          <RightPanel />
        </aside>
      )}

      {/* Command Palette Overlay */}
      <CommandPalette />
    </div>
  );
}
