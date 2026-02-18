import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-content">
        <div className="hero-text">
          <h1>Tired of productivity tools that need their own tutorials?</h1>
          <p className="hero-subtitle">
            Finally, a to-do app that gets out of your way. Simple tasks. Simply done.
          </p>
          <p className="hero-tagline">Do more. Manage less.</p>
          <div className="hero-cta">
            <a href="#cta" className="btn btn-primary btn-large">
              Start For Free
            </a>
            <span className="hero-note">No credit card required</span>
          </div>
        </div>
        <div className="hero-image">
          <div className="app-preview">
            <div className="preview-header">
              <span className="preview-dot"></span>
              <span className="preview-dot"></span>
              <span className="preview-dot"></span>
            </div>
            <div className="preview-content">
              <div className="preview-input">
                <span className="preview-input-icon">+</span>
                <span className="preview-input-text">Add a new task...</span>
              </div>
              <div className="preview-tasks">
                <div className="preview-task completed">
                  <span className="task-checkbox checked">✓</span>
                  <span className="task-text">Review marketing copy</span>
                </div>
                <div className="preview-task completed">
                  <span className="task-checkbox checked">✓</span>
                  <span className="task-text">Send project update</span>
                </div>
                <div className="preview-task">
                  <span className="task-checkbox"></span>
                  <span className="task-text">Plan weekend trip</span>
                </div>
                <div className="preview-task">
                  <span className="task-checkbox"></span>
                  <span className="task-text">Call mom</span>
                </div>
              </div>
              <div className="preview-footer">
                <span className="preview-count">2 items left</span>
                <span className="preview-filter active">All</span>
                <span className="preview-filter">Active</span>
                <span className="preview-filter">Done</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
