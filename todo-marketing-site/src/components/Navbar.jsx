import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <a href="#" className="navbar-logo">
          <span className="logo-icon">✓</span>
          <span className="logo-text">SimpleDo</span>
        </a>
        <div className="navbar-links">
          <a href="#features">Features</a>
          <a href="#testimonials">Reviews</a>
          <a href="#about">About</a>
          <a href="#cta" className="btn btn-primary">Get Started Free</a>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
