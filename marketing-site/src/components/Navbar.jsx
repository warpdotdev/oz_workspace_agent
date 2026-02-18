import { useState } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[var(--color-card)] bg-opacity-95 backdrop-blur-sm z-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[var(--color-text-primary)]">SimpleDo</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
              Features
            </a>
            <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
              Pricing
            </a>
            <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
              About
            </a>
            <a
              href="#get-started"
              className="px-6 py-2 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity min-h-[44px] flex items-center"
            >
              Get Started
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6 text-[var(--color-text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors py-2">
                Features
              </a>
              <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors py-2">
                Pricing
              </a>
              <a href="#" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors py-2">
                About
              </a>
              <a
                href="#get-started"
                className="px-6 py-3 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-center"
              >
                Get Started
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
