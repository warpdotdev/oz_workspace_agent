import { Navigation } from "@/components/layout/navigation";
import { AgentForm } from "@/components/agents";

export default function NewAgentPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Create New Agent</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new AI agent in just a few steps
          </p>
        </div>
        <AgentForm />
      </main>
    </div>
  );
}
