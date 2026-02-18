import './Testimonials.css';

const testimonials = [
  {
    quote: "Finally, a to-do app that doesn't try to be everything. I actually use this one.",
    author: "Sarah K.",
    role: "Freelance Designer"
  },
  {
    quote: "I've tried Notion, Todoist, Things—they all felt like work. SimpleDo just clicks.",
    author: "Marcus T.",
    role: "Software Engineer"
  },
  {
    quote: "My productivity went up the moment I stopped managing my productivity tools.",
    author: "Jamie L.",
    role: "Small Business Owner"
  }
];

function Testimonials() {
  return (
    <section className="testimonials">
      <div className="testimonials-container">
        <h2 className="testimonials-title">Don't just take our word for it</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div className="testimonial-card" key={index}>
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
  );
}

export default Testimonials;
