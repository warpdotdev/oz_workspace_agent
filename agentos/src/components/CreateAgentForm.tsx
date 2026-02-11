import { useState } from "react";
import { useAgentStore } from "@/store/agentStore";
import { createAgent } from "@/lib/tauri";
import type { AgentFramework } from "@/types";

interface CreateAgentFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AVAILABLE_TOOLS = [
  { id: "web_search", label: "Web Search" },
  { id: "code_execution", label: "Code Execution" },
  { id: "file_system", label: "File System Access" },
  { id: "database", label: "Database Access" },
  { id: "api_calls", label: "API Calls" },
  { id: "memory", label: "Long-term Memory" },
];

export function CreateAgentForm({ onClose, onSuccess }: CreateAgentFormProps) {
  const { addAgent } = useAgentStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [framework, setFramework] = useState<AgentFramework>("openai");
  const [model, setModel] = useState("gpt-4");
  const [maxTokens, setMaxTokens] = useState(4096);
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  const handleToolToggle = (toolId: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Agent name is required");
      return;
    }
    if (!description.trim()) {
      setError("Agent description is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const newAgent = await createAgent({
        name: name.trim(),
        description: description.trim(),
        framework,
        model: model.trim() || undefined,
        maxTokens: maxTokens > 0 ? maxTokens : undefined,
        temperature: temperature >= 0 && temperature <= 1 ? temperature : undefined,
        systemPrompt: systemPrompt.trim() || undefined,
        tools: selectedTools.length > 0 ? selectedTools : undefined,
      });

      addAgent(newAgent);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-background-secondary rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Create New Agent</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
              Agent Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Customer Support Agent"
              className="w-full px-3 py-2 bg-background-tertiary border border-border rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              rows={3}
              className="w-full px-3 py-2 bg-background-tertiary border border-border rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Framework */}
          <div>
            <label htmlFor="framework" className="block text-sm font-medium text-text-primary mb-2">
              Framework
            </label>
            <select
              id="framework"
              value={framework}
              onChange={(e) => setFramework(e.target.value as AgentFramework)}
              className="w-full px-3 py-2 bg-background-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="openai">OpenAI</option>
              <option value="langchain">LangChain</option>
              <option value="crewai">CrewAI</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Model Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-text-primary mb-2">
                Model
              </label>
              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4"
                className="w-full px-3 py-2 bg-background-tertiary border border-border rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="maxTokens" className="block text-sm font-medium text-text-primary mb-2">
                Max Tokens
              </label>
              <input
                id="maxTokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                min="1"
                max="128000"
                className="w-full px-3 py-2 bg-background-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-text-primary mb-2">
                Temperature
              </label>
              <input
                id="temperature"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                min="0"
                max="1"
                step="0.1"
                className="w-full px-3 py-2 bg-background-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-text-primary mb-2">
              System Prompt <span className="text-text-tertiary text-xs">(Optional)</span>
            </label>
            <textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful assistant that..."
              rows={4}
              className="w-full px-3 py-2 bg-background-tertiary border border-border rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Tools */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Tools <span className="text-text-tertiary text-xs">(Optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_TOOLS.map((tool) => (
                <label
                  key={tool.id}
                  className="flex items-center gap-2 px-3 py-2 bg-background-tertiary border border-border rounded cursor-pointer hover:bg-surface-hover transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTools.includes(tool.id)}
                    onChange={() => handleToolToggle(tool.id)}
                    className="w-4 h-4 rounded border-border bg-background-tertiary text-accent focus:ring-2 focus:ring-accent focus:ring-offset-0"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-text-primary">{tool.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-primary hover:bg-surface-hover rounded transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Close Icon
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
