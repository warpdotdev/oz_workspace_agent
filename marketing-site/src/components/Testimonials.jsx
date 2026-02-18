const testimonials = [
  {
    quote: "I've tried every productivity app out there. This is the first one I actually stuck with. It just works.",
    author: "Sarah K.",
    role: "Freelance Designer",
    avatar: "SK"
  },
  {
    quote: "Finally, an app that doesn't try to be everything. I open it, add my tasks, check them off. That's it. Perfect.",
    author: "Marcus T.",
    role: "Startup Founder",
    avatar: "MT"
  },
  {
    quote: "My team was skeptical when I suggested yet another task app. Two weeks later, everyone's using it daily.",
    author: "Jennifer L.",
    role: "Project Manager",
    avatar: "JL"
  }
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-[var(--color-background)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
            Loved by people who hate complexity
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Join thousands who've escaped the productivity tool hamster wheel.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-[var(--color-card)] rounded-2xl p-8 shadow-sm border border-gray-100"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-[var(--color-text-primary)] mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{testimonial.author}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
