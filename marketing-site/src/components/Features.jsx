import './Features.css';

const features = [
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'No loading screens, no sync delays. Your tasks appear instantly. Add, check off, and move on with your day.'
  },
  {
    icon: '🎯',
    title: 'Zero Learning Curve',
    description: 'Works exactly how you expect. No onboarding tutorials, no feature overload—just a clean list that does what you need.'
  },
  {
    icon: '🔒',
    title: 'Privacy First',
    description: 'Your tasks stay on your device. No accounts required, no data harvesting, no ads. Just you and your to-do list.'
  }
];

function Features() {
  return (
    <section className="features" id="features">
      <div className="features-container">
        <h2 className="features-title">Why people love SimpleDo</h2>
        <p className="features-subtitle">
          We obsessed over every detail so you don't have to think about the app—just your tasks.
        </p>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
