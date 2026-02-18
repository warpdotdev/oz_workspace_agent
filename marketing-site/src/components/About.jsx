import './About.css';

function About() {
  return (
    <section className="about" id="about">
      <div className="about-container">
        <div className="about-content">
          <h2 className="about-title">Built for people who actually want to get things done</h2>
          <p className="about-text">
            We've all been there—downloading a new productivity app, spending an hour setting it up, watching tutorial videos, and then never opening it again.
          </p>
          <p className="about-text">
            SimpleDo was born from frustration. We wanted a to-do app that felt invisible—one that helps you capture tasks and get back to your life in seconds, not minutes.
          </p>
          <p className="about-text">
            Our philosophy is simple: <strong>the best tool is the one you'll actually use</strong>. So we stripped away everything that wasn't essential and polished what remained until it felt effortless.
          </p>
          <p className="about-text">
            No enterprise features. No complex workflows. No gamification. Just a clean, fast place to track what needs to get done today.
          </p>
        </div>
        <div className="about-cta">
          <h3 className="cta-title">Ready to simplify your day?</h3>
          <p className="cta-subtitle">Join thousands who've ditched the bloat.</p>
          <button className="cta-button">Start Using SimpleDo</button>
        </div>
      </div>
    </section>
  );
}

export default About;
