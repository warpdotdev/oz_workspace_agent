import './Testimonials.css'

const testimonials = [
  {
    quote: "I've tried every productivity app out there. This is the first one I've actually stuck with. It just works.",
    author: "Sarah M.",
    role: "Freelance Designer"
  },
  {
    quote: "Finally, an app that doesn't try to do everything. I add my tasks, I check them off, I'm done. Perfect.",
    author: "Marcus T.",
    role: "Software Engineer"
  },
  {
    quote: "My favorite thing? No signup required. I was productive in literally 3 seconds.",
    author: "Emily R.",
    role: "Small Business Owner"
  }
]

function Testimonials() {
  return (
    <section id="testimonials" className="testimonials section">
      <div className="container">
        <div className="section-header">
          <h2>Loved by people who get things done</h2>
          <p>Join thousands who've ditched complexity for clarity.</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <p className="testimonial-quote">"{testimonial.quote}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  {testimonial.author.charAt(0)}
                </div>
                <div className="author-info">
                  <span className="author-name">{testimonial.author}</span>
                  <span className="author-role">{testimonial.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
