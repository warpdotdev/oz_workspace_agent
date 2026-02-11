import { Sidebar } from "@/components/Sidebar";
import { MainPanel } from "@/components/MainPanel";
import { ActivityPanel } from "@/components/ActivityPanel";
import { CommandBar } from "@/components/CommandBar";
import { useBackendSync } from "@/hooks/useBackendSync";

function App() {
  // Initialize and sync with Tauri backend
  useBackendSync();

  return (
    <div className="h-screen flex bg-background-primary text-text-primary">
      {/* Three-panel layout */}
      <Sidebar />
      <MainPanel />
      <ActivityPanel />

      {/* Command Bar Modal */}
      <CommandBar />
    </div>
  );
}

export default App;
