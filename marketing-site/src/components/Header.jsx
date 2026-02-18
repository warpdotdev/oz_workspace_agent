import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <a href="/" className="header-logo">SimpleDo</a>
        <nav className="header-nav">
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>
        <button className="header-cta">Get Started</button>
      </div>
    </header>
  );
}

export default Header;
