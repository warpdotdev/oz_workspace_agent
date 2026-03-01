import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Bot, Globe, Code, FileText, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { useAppStore } from "../../store/appStore";
import type { AgentTemplate } from "../../types";

const templates: {
  id: AgentTemplate;
  name: string;
  description: string;
  icon: typeof Bot;
}[] = [
  {
    id: "blank",
    name: "Blank Agent",
    description: "Start from scratch with an empty agent configuration",
    icon: FileText,
  },
  {
    id: "web-scraper",
    name: "Web Scraper",
    description: "Pre-configured agent for web data extraction and monitoring",
    icon: Globe,
  },
  {
    id: "code-assistant",
    name: "Code Assistant",
    description: "Agent optimized for code review, generation, and analysis",
    icon: Code,
  },
];

export function CreateAgentModal() {
  const open = useAppStore((s) => s.createAgentModalOpen);
  const setOpen = useAppStore((s) => s.setCreateAgentModalOpen);
  const addAgent = useAppStore((s) => s.addAgent);
  const setSelectedAgentId = useAppStore((s) => s.setSelectedAgentId);

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<AgentTemplate>("blank");

  const resetAndClose = () => {
    setStep(1);
    setName("");
    setDescription("");
    setTemplate("blank");
    setOpen(false);
  };

  const handleCreate = () => {
    const id = `agent-${Date.now()}`;
    const now = new Date().toISOString();
    addAgent({
      id,
      name: name.trim() || "Untitled Agent",
      status: "paused",
      description: description.trim() || undefined,
      template,
      createdAt: now,
      updatedAt: now,
    });
    setSelectedAgentId(id);
    resetAndClose();
  };

  const canProceedStep1 = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
      <DialogContent className="max-w-[480px]">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-4 px-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  step >= s
                    ? "bg-accent text-white"
                    : "bg-surface text-text-tertiary"
                }`}
              >
                {step > s ? <Check size={12} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-px w-8 transition-colors ${
                    step > s ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Name & Description */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Give your agent a name and description.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 px-5 pb-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Name
                </label>
                <Input
                  placeholder="e.g. Code Reviewer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canProceedStep1) setStep(2);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">
                  Description{" "}
                  <span className="text-text-tertiary font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="What does this agent do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Next
                <ArrowRight size={14} />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Template */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Choose a Template</DialogTitle>
              <DialogDescription>
                Select a starting template for your agent.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 px-5 pb-2">
              {templates.map((t) => {
                const Icon = t.icon;
                const isSelected = template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-accent bg-accent/8"
                        : "border-border hover:border-border hover:bg-surface"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md shrink-0 ${
                        isSelected
                          ? "bg-accent text-white"
                          : "bg-surface text-text-tertiary"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? "text-text-primary" : "text-text-secondary"
                        }`}
                      >
                        {t.name}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {t.description}
                      </span>
                    </div>
                    {isSelected && (
                      <Check
                        size={16}
                        className="text-accent shrink-0 ml-auto mt-1"
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={14} />
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next
                <ArrowRight size={14} />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Agent</DialogTitle>
              <DialogDescription>
                Review your agent configuration before creating.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 px-5 pb-2">
              <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-accent" />
                  <span className="text-sm font-medium text-text-primary">
                    {name || "Untitled Agent"}
                  </span>
                </div>
                {description && (
                  <p className="text-xs text-text-secondary pl-6">
                    {description}
                  </p>
                )}
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-xs text-text-tertiary">Template:</span>
                  <span className="text-xs text-text-secondary font-medium">
                    {templates.find((t) => t.id === template)?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-xs text-text-tertiary">Status:</span>
                  <span className="text-xs text-status-paused font-medium">
                    Paused
                  </span>
                </div>
              </div>
              <p className="text-xs text-text-tertiary">
                Default folders (markdown, memory, skills) will be created
                automatically.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft size={14} />
                Back
              </Button>
              <Button onClick={handleCreate}>
                Create Agent
                <Check size={14} />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
