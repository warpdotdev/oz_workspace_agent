import './CTA.css'

function CTA() {
  return (
    <section id="cta" className="cta section">
      <div className="container">
        <div className="cta-content">
          <h2>Ready to actually get things done?</h2>
          <p>
            Start using SimpleDo right now. No sign up, no credit card, no commitment.
            Just open it and start adding tasks.
          </p>
          <a href="#" className="btn btn-primary btn-large">
            Launch SimpleDo — It's Free
          </a>
          <span className="cta-note">Works in your browser. Nothing to install.</span>
        </div>
      </div>
    </section>
  )
}

export default CTA
