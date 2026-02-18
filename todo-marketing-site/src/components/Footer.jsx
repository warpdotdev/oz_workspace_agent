import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <a href="#" className="footer-logo">
            <span className="logo-icon">✓</span>
            <span className="logo-text">SimpleDo</span>
          </a>
          <p>Clarity in simplicity.</p>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#testimonials">Reviews</a>
            <a href="#cta">Get Started</a>
          </div>
          <div className="footer-column">
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#">Blog</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {currentYear} SimpleDo. All rights reserved.</p>
        <p>Made with ❤️ for people who value their time.</p>
      </div>
    </footer>
  )
}

export default Footer
