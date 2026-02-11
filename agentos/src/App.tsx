import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MainPanel } from "@/components/MainPanel";
import { ActivityPanel } from "@/components/ActivityPanel";
import { CommandBar } from "@/components/CommandBar";
import { TaskDispatchPanel } from "@/components/TaskDispatchPanel";
import { useAgentStore } from "@/store/agentStore";
import {
  generateMockAgents,
  mockSimulator,
} from "@/lib/mockAgentService";

function App() {
  const { setAgents, agents, addActivity, updateAgent, addMetrics } =
    useAgentStore();
  const [isTaskDispatchOpen, setIsTaskDispatchOpen] = useState(false);

  // Initialize with mock agents on first load
  useEffect(() => {
    const initialAgents = generateMockAgents(3);
    // Set one agent to running for demo purposes
    initialAgents[0].status = "running";
    initialAgents[0].currentTask = "Analyzing market trends for Q1 2026";
    setAgents(initialAgents);
  }, [setAgents]);

  // Set up mock simulator when agents change
  useEffect(() => {
    mockSimulator.setAgents(agents);
    mockSimulator.onActivity(addActivity);
    mockSimulator.onStatusChange((agentId, status) => {
      updateAgent(agentId, { status });
    });
    mockSimulator.onMetrics((agentId, metrics) => {
      addMetrics(agentId, metrics);
    });
    mockSimulator.start(3000); // Generate activity every 3 seconds

    return () => {
      mockSimulator.stop();
    };
  }, [agents, addActivity, updateAgent, addMetrics]);

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
