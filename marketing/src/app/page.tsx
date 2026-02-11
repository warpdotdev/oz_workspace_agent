import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgentOS - Autonomous AI Agent Management",
  description:
    "A powerful macOS desktop application for managing autonomous AI agents. Monitor, control, and orchestrate your AI workforce from a single dashboard.",
};

// Icons as inline SVGs
const AgentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MonitorIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CommandIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TaskIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IntegrationIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
);

const features = [
  {
    icon: AgentIcon,
    title: "Agent Management",
    description: "Create, configure, and manage multiple AI agents with different frameworks like OpenAI, LangChain, and CrewAI.",
  },
  {
    icon: MonitorIcon,
    title: "Real-time Monitoring",
    description: "Track agent performance, resource usage, and task completion rates with live dashboards and metrics.",
  },
  {
    icon: CommandIcon,
    title: "Quick Commands",
    description: "Cmd+K command bar for rapid agent control. Start, stop, pause, or dispatch tasks instantly.",
  },
  {
    icon: TaskIcon,
    title: "Task Dispatch",
    description: "Assign tasks to agents with priority levels, track progress, and view detailed execution logs.",
  },
  {
    icon: ActivityIcon,
    title: "Activity Feed",
    description: "Real-time activity stream showing all agent events, task completions, and system notifications.",
  },
  {
    icon: IntegrationIcon,
    title: "Framework Support",
    description: "Native support for popular AI frameworks. Extend with custom integrations via a simple plugin API.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-text-primary font-semibold text-xl">AgentOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors">Features</a>
            <a href="#demo" className="text-text-secondary hover:text-text-primary transition-colors">Demo</a>
            <a href="https://github.com/warpdotdev/oz_workspace_agent" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">GitHub</a>
          </div>
          <a href="#download" className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg font-medium transition-colors">Download</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border-subtle mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-status-running animate-pulse"></span>
            <span className="text-text-secondary text-sm">v0.1 Now Available</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 animate-slide-up">
            Manage Your <span className="gradient-text">AI Agents</span>
            <br />From One Place
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 animate-slide-up">
            A powerful macOS desktop application for orchestrating autonomous AI agents. Monitor performance, dispatch tasks, and scale your AI workforce effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <a href="#download" className="px-8 py-4 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 animate-glow">Download for macOS</a>
            <a href="#demo" className="px-8 py-4 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-xl font-semibold text-lg transition-colors">Watch Demo</a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[{ value: "4+", label: "AI Frameworks" }, { value: "Real-time", label: "Monitoring" }, { value: "Native", label: "macOS App" }, { value: "Open", label: "Source" }].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-text-primary">{stat.value}</div>
                <div className="text-text-tertiary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-border bg-background-secondary shadow-2xl">
            {/* macOS Window Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-background-tertiary border-b border-border">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
              <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
              <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
              <span className="ml-4 text-text-tertiary text-sm">AgentOS</span>
            </div>

            {/* App Screenshot Placeholder */}
            <div className="aspect-video bg-background-primary flex items-center justify-center">
              <div className="flex w-full h-full">
                {/* Sidebar */}
                <div className="w-60 bg-background-secondary border-r border-border p-4">
                  <div className="space-y-3">
                    <div className="h-8 w-32 bg-surface rounded"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-surface-hover">
                          <div className="w-8 h-8 rounded-full bg-accent-primary/20"></div>
                          <div className="flex-1">
                            <div className="h-3 w-20 bg-border rounded"></div>
                            <div className="h-2 w-12 bg-border-subtle rounded mt-1"></div>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-status-running"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Panel */}
                <div className="flex-1 p-6">
                  <div className="h-6 w-40 bg-surface rounded mb-4"></div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 bg-surface rounded-lg">
                        <div className="h-3 w-16 bg-border rounded mb-2"></div>
                        <div className="h-6 w-12 bg-accent-primary/30 rounded"></div>
                      </div>
                    ))}
                  </div>
                  <div className="h-40 bg-surface rounded-lg"></div>
                </div>

                {/* Activity Panel */}
                <div className="w-80 bg-background-secondary border-l border-border p-4">
                  <div className="h-6 w-24 bg-surface rounded mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-accent-secondary/20 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="h-3 w-full bg-border rounded"></div>
                          <div className="h-2 w-16 bg-border-subtle rounded mt-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-background-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-4">Everything You Need to Manage AI Agents</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">A complete toolkit for orchestrating autonomous AI agents with real-time monitoring and control.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="p-6 bg-background-primary rounded-xl border border-border hover:border-accent-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-4">
                  <feature.icon />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-text-primary mb-4">See It In Action</h2>
          <p className="text-text-secondary text-lg mb-10">Watch how AgentOS makes managing autonomous AI agents effortless.</p>

          {/* Video Placeholder */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-background-secondary">
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 rounded-full bg-accent-primary hover:bg-accent-primary/90 flex items-center justify-center transition-all hover:scale-110 animate-glow">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4">
              <div className="flex-1 h-1 bg-border rounded-full">
                <div className="w-0 h-full bg-accent-primary rounded-full"></div>
              </div>
              <span className="text-text-tertiary text-sm">0:00 / 2:30</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-20 px-6 bg-gradient-to-b from-background-primary to-background-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-text-primary mb-4">Ready to Orchestrate Your AI Workforce?</h2>
          <p className="text-text-secondary text-lg mb-10">Download AgentOS for free and start managing your autonomous agents today.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a href="#" className="px-8 py-4 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 flex items-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Download for macOS
            </a>
            <a href="https://github.com/warpdotdev/oz_workspace_agent" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-surface hover:bg-surface-hover border border-border text-text-primary rounded-xl font-semibold text-lg transition-colors flex items-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>

          {/* System Requirements */}
          <div className="text-text-tertiary text-sm">
            <p>Requires macOS 12.0 or later</p>
            <p className="mt-1">Intel and Apple Silicon supported</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="text-text-secondary">AgentOS &copy; 2026. Open Source.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/warpdotdev/oz_workspace_agent" target="_blank" rel="noopener noreferrer" className="text-text-tertiary hover:text-text-primary transition-colors">GitHub</a>
            <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors">Documentation</a>
            <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
