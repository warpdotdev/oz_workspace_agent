import './Features.css'

const features = [
  {
    icon: '⚡',
    title: 'Zero Learning Curve',
    description: 'Works exactly how you expect it to. Add a task, check it off, move on with your day. No tutorials needed.'
  },
  {
    icon: '🪶',
    title: 'Fast & Lightweight',
    description: 'No bloat, no friction. Opens instantly and stays out of your way so you can focus on what matters.'
  },
  {
    icon: '🔒',
    title: 'Privacy First',
    description: 'Your tasks stay on your device. No accounts required, no data harvesting. Your business is your business.'
  }
]

function Features() {
  return (
    <section id="features" className="features section">
      <div className="container">
        <div className="section-header">
          <h2>Everything you need. Nothing you don't.</h2>
          <p>We stripped away the complexity so you can actually get things done.</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
