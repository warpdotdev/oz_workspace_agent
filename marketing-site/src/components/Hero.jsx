export default function Hero() {
  return (
    <section className="min-h-screen flex items-center bg-[var(--color-background)]">
      <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-text-primary)] leading-tight">
            Do more.<br />
            <span className="text-[var(--color-primary)]">Manage less.</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-lg">
            Tired of productivity tools that need their own tutorials? Finally, a to-do app that gets out of your way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#get-started"
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity min-h-[44px]"
            >
              Get Started Free
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold rounded-xl hover:bg-[var(--color-primary)] hover:text-white transition-colors min-h-[44px]"
            >
              See Features
            </a>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            No credit card required • Free forever for personal use
          </p>
        </div>
        
        <div className="relative">
          <div className="bg-[var(--color-card)] rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[var(--color-background)] rounded-lg">
                <div className="w-5 h-5 rounded border-2 border-[var(--color-primary)]"></div>
                <span className="text-[var(--color-text-primary)]">Plan morning workout</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[var(--color-background)] rounded-lg">
                <div className="w-5 h-5 rounded bg-[var(--color-success)] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[var(--color-text-secondary)] line-through">Review project proposal</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[var(--color-background)] rounded-lg">
                <div className="w-5 h-5 rounded border-2 border-[var(--color-primary)]"></div>
                <span className="text-[var(--color-text-primary)]">Call mom back</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[var(--color-background)] rounded-lg">
                <div className="w-5 h-5 rounded border-2 border-[var(--color-primary)]"></div>
                <span className="text-[var(--color-text-primary)]">Grocery shopping</span>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 bg-[var(--color-success)] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            1 of 4 done!
          </div>
        </div>
      </div>
    </section>
  );
}
