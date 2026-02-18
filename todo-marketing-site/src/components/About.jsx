import './About.css'

function About() {
  return (
    <section id="about" className="about section">
      <div className="container">
        <div className="about-content">
          <div className="about-text">
            <h2>Built for focus, not features</h2>
            <p>
              We got tired of productivity tools that felt like full-time jobs to manage. 
              The irony wasn't lost on us: apps designed to help you get things done 
              were actually getting in the way.
            </p>
            <p>
              So we built something different. No team collaboration features you'll never use. 
              No AI suggestions telling you what to prioritize. No gamification trying to 
              turn your work into a video game.
            </p>
            <p>
              Just a clean, fast, beautiful place to keep track of what you need to do. 
              That's it. That's the whole philosophy.
            </p>
            <div className="about-values">
              <div className="value-item">
                <span className="value-icon">✨</span>
                <span>Simplicity over features</span>
              </div>
              <div className="value-item">
                <span className="value-icon">🎯</span>
                <span>Focus over distraction</span>
              </div>
              <div className="value-item">
                <span className="value-icon">🤝</span>
                <span>Your time over our metrics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
