import './Hero.css';

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-headline">
          Tired of productivity tools that need their own tutorials?
        </h1>
        <p className="hero-tagline">
          Do more. Manage less.
        </p>
        <p className="hero-description">
          A beautifully simple to-do app that gets out of your way. No bloat, no learning curve—just you and your tasks.
        </p>
        <button className="hero-cta">
          Get Started Free
        </button>
      </div>
      <div className="hero-image">
        <div className="app-screenshot">
          <div className="screenshot-header">
            <div className="screenshot-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="screenshot-title">SimpleDo</span>
          </div>
          <div className="screenshot-content">
            <div className="screenshot-input">
              <span className="plus-icon">+</span>
              <span>Add a new task...</span>
            </div>
            <div className="screenshot-task completed">
              <span className="checkbox checked">✓</span>
              <span className="task-text strikethrough">Review project proposal</span>
            </div>
            <div className="screenshot-task">
              <span className="checkbox"></span>
              <span className="task-text">Call with design team</span>
            </div>
            <div className="screenshot-task">
              <span className="checkbox"></span>
              <span className="task-text">Prepare presentation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
