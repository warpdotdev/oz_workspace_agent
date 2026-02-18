export default function CTA() {
  return (
    <section id="get-started" className="py-20 bg-[var(--color-primary)]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to actually get things done?
        </h2>
        <p className="text-xl text-white text-opacity-90 mb-8 max-w-2xl mx-auto">
          Stop managing your productivity tools and start being productive. It takes 10 seconds to get started.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-[var(--color-primary)] font-semibold rounded-xl hover:bg-opacity-90 transition-opacity min-h-[44px] shadow-lg"
          >
            Start Free Today
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-[var(--color-primary)] transition-colors min-h-[44px]"
          >
            Learn More
          </a>
        </div>
        <p className="text-white text-opacity-75 mt-6 text-sm">
          No sign-up required • Works offline • Your data stays yours
        </p>
      </div>
    </section>
  );
}
