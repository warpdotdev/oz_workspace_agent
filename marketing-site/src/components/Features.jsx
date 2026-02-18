const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Lightning Fast",
    description: "No loading screens, no sync delays. Add tasks instantly and watch them save in real-time. Your productivity shouldn't wait for your tools."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: "Delightfully Simple",
    description: "Zero learning curve. If you can write a sticky note, you can use our app. No tutorials needed, no features to unlock, no complexity hiding around corners."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Private by Design",
    description: "Your tasks stay on your device. No accounts required, no data harvesting, no \"anonymous analytics\". What you do is your business."
  }
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-[var(--color-card)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            We built the to-do app we always wanted—one that respects your time and intelligence.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-[var(--color-background)] rounded-2xl p-8 hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 bg-[var(--color-primary)] bg-opacity-10 rounded-xl flex items-center justify-center text-[var(--color-primary)] mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                {feature.title}
              </h3>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
