import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MainPanel } from "@/components/MainPanel";
import { ActivityPanel } from "@/components/ActivityPanel";
import { CommandBar } from "@/components/CommandBar";
import { TaskDispatchPanel } from "@/components/TaskDispatchPanel";
import { useBackendSync } from "@/hooks/useBackendSync";

function App() {
  const [isTaskDispatchOpen, setIsTaskDispatchOpen] = useState(false);
  
  // Initialize and sync with Tauri backend
  useBackendSync();

  return (
    <div className="h-screen flex bg-background-primary text-text-primary">
      {/* Three-panel layout */}
      <Sidebar />
      <MainPanel />
      <ActivityPanel />

      {/* Command Bar Modal */}
      <CommandBar onOpenTaskDispatch={() => setIsTaskDispatchOpen(true)} />

      {/* Task Dispatch Panel */}
      <TaskDispatchPanel
        isOpen={isTaskDispatchOpen}
        onClose={() => setIsTaskDispatchOpen(false)}
      />
    </div>
  );
}

export default App;
