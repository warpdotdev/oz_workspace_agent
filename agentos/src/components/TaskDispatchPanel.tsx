import { useState, useEffect } from "react";
import { useAgentStore } from "@/store/agentStore";
import { Task, TaskStatus } from "@/types";
import { dispatchTask, getAgentTasks } from "@/lib/tauri";

interface TaskDispatchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type TaskPriority = "low" | "medium" | "high" | "urgent";

export function TaskDispatchPanel({ isOpen, onClose }: TaskDispatchPanelProps) {
  const { agents, addTask, addActivity, updateAgent } = useAgentStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskHistory, setTaskHistory] = useState<Task[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load task history when agent is selected
  useEffect(() => {
    async function loadTaskHistory() {
      if (!selectedAgentId) {
        setTaskHistory([]);
        return;
      }

      setLoadingHistory(true);
      try {
        const tasks = await getAgentTasks(selectedAgentId);
        setTaskHistory(tasks);
      } catch (err) {
        console.error("Failed to load task history:", err);
        // Fall back to store tasks if backend unavailable
        setTaskHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadTaskHistory();
  }, [selectedAgentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgentId) {
      setError("Please select an agent");
      return;
    }
    
    if (!taskDescription.trim()) {
      setError("Please enter a task description");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Dispatch task via Tauri IPC
      const task = await dispatchTask({
        agentId: selectedAgentId,
        instruction: taskDescription.trim(),
      });

      // Add to store
      addTask(task);

      // Update agent status to running
      updateAgent(selectedAgentId, { 
        status: "running",
        currentTask: taskDescription.trim(),
      });

      // Add activity event
      const agent = agents.find((a) => a.id === selectedAgentId);
      if (agent) {
        addActivity({
          id: `act-${Date.now()}`,
          agentId: selectedAgentId,
          agentName: agent.config.name,
          type: "action",
          eventType: "action",
          content: `Task dispatched: ${taskDescription.trim()}`,
          message: `Task dispatched (Priority: ${priority})`,
          timestamp: new Date().toISOString(),
        });
      }

      // Update local task history
      setTaskHistory((prev) => [task, ...prev]);

      // Reset form
      setTaskDescription("");
      setPriority("medium");
      
    } catch (err) {
      console.error("Failed to dispatch task:", err);
      setError(err instanceof Error ? err.message : "Failed to dispatch task");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl mx-4 bg-background-secondary rounded-xl border border-border shadow-2xl animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Dispatch Task</h2>
            <p className="text-sm text-text-tertiary">Send a task to an agent for execution</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Agent Selector */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Select Agent
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="">Choose an agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.config.name} ({agent.status})
                </option>
              ))}
            </select>
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Task Description
            </label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe the task you want the agent to perform..."
              rows={4}
              className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            />
          </div>

          {/* Priority Selector */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    priority === p
                      ? getPriorityActiveStyle(p)
                      : "bg-background-tertiary text-text-secondary hover:bg-surface-hover"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedAgentId || !taskDescription.trim()}
              className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner className="w-4 h-4" />
                  Dispatching...
                </span>
              ) : (
                "Dispatch Task"
              )}
            </button>
          </div>
        </form>

        {/* Task History */}
        {selectedAgentId && (
          <div className="border-t border-border">
            <div className="px-6 py-3 bg-background-tertiary/50">
              <h3 className="text-sm font-medium text-text-secondary">Task History</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8 text-text-tertiary">
                  <LoadingSpinner className="w-5 h-5 mr-2" />
                  Loading tasks...
                </div>
              ) : taskHistory.length === 0 ? (
                <div className="py-8 text-center text-text-tertiary text-sm">
                  No tasks dispatched to this agent yet
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-background-tertiary/30 text-xs text-text-tertiary">
                    <tr>
                      <th className="text-left px-6 py-2 font-medium">Timestamp</th>
                      <th className="text-left px-6 py-2 font-medium">Task</th>
                      <th className="text-left px-6 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {taskHistory.map((task) => (
                      <tr key={task.id} className="border-t border-border/50 hover:bg-surface-hover/50">
                        <td className="px-6 py-3 text-text-tertiary whitespace-nowrap">
                          {formatTimestamp(task.createdAt)}
                        </td>
                        <td className="px-6 py-3 text-text-primary">
                          <span className="line-clamp-1">{task.instruction}</span>
                        </td>
                        <td className="px-6 py-3">
                          <TaskStatusBadge status={task.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getPriorityActiveStyle(priority: TaskPriority): string {
  switch (priority) {
    case "low":
      return "bg-gray-600 text-white";
    case "medium":
      return "bg-blue-600 text-white";
    case "high":
      return "bg-orange-600 text-white";
    case "urgent":
      return "bg-red-600 text-white";
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Task Status Badge
function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    running: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status === "running" && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5 animate-pulse" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Icons
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
