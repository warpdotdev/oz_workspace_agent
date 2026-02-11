export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex h-14 items-center justify-between text-sm text-muted-foreground">
        <div>
          © {new Date().getFullYear()} AI Agent Manager. All rights reserved.
        </div>
        <div className="flex gap-4">
          <a
            href="/docs"
            className="hover:text-foreground transition-colors"
          >
            Documentation
          </a>
          <a
            href="/support"
            className="hover:text-foreground transition-colors"
          >
            Support
          </a>
          <a
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  )
}
