/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // AgentOS Design System — Dark-first palette
        // Spec: calm density, progressive disclosure (Linear meets VS Code)
        background: {
          base: "#0A0A0B",
          raised: "#141415",
          elevated: "#1C1C1E",
          overlay: "#252527",
        },
        surface: {
          DEFAULT: "#141415",
          hover: "#1C1C1E",
          active: "#252527",
          selected: "#1E1B2E", // Violet tint for selected states
        },
        border: {
          DEFAULT: "#2A2A2D",
          subtle: "#1F1F22",
          strong: "#3A3A3F",
          focus: "#6E56CF",
        },
        text: {
          primary: "#EDEDEF",
          secondary: "#A0A0A6",
          tertiary: "#6E6E76",
          disabled: "#4A4A52",
          inverse: "#0A0A0B",
        },
        // Primary accent — Violet #6E56CF
        accent: {
          DEFAULT: "#6E56CF",
          hover: "#7C66D9",
          muted: "#6E56CF26",
          subtle: "#6E56CF10",
        },
        // Agent status colors (domain-specific)
        status: {
          running: "#30A46C",
          "running-muted": "#30A46C26",
          error: "#E5484D",
          "error-muted": "#E5484D26",
          deploying: "#F5A623",
          "deploying-muted": "#F5A62326",
          paused: "#6E56CF",
          "paused-muted": "#6E56CF26",
          idle: "#6E6E76",
          "idle-muted": "#6E6E7626",
        },
        // Semantic colors
        success: { DEFAULT: "#30A46C", muted: "#30A46C26" },
        warning: { DEFAULT: "#F5A623", muted: "#F5A62326" },
        danger: { DEFAULT: "#E5484D", muted: "#E5484D26" },
        info: { DEFAULT: "#3B82F6", muted: "#3B82F626" },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SF Mono",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.8125rem", { lineHeight: "1.125rem" }],
        base: ["0.875rem", { lineHeight: "1.25rem" }],
        lg: ["1rem", { lineHeight: "1.5rem" }],
        xl: ["1.125rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      letterSpacing: {
        tighter: "-0.03em",
        tight: "-0.02em",
        normal: "0",
        wide: "0.02em",
        wider: "0.04em",
      },
      spacing: {
        0.5: "2px",
        1: "4px",
        1.5: "6px",
        2: "8px",
        2.5: "10px",
        3: "12px",
        3.5: "14px",
        4: "16px",
        5: "20px",
        6: "24px",
        7: "28px",
        8: "32px",
        9: "36px",
        10: "40px",
        12: "48px",
        14: "56px",
        16: "64px",
        sidebar: "240px",
        "context-panel": "320px",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
        DEFAULT: "0 2px 8px 0 rgba(0, 0, 0, 0.4)",
        md: "0 4px 16px 0 rgba(0, 0, 0, 0.5)",
        lg: "0 8px 32px 0 rgba(0, 0, 0, 0.6)",
        "glow-accent": "0 0 12px rgba(110, 86, 207, 0.4)",
        "glow-running": "0 0 8px rgba(48, 164, 108, 0.5)",
        "glow-error": "0 0 8px rgba(229, 72, 77, 0.5)",
      },
      animation: {
        "fade-in": "fadeIn 150ms ease-out",
        "fade-out": "fadeOut 150ms ease-in",
        "slide-in-right": "slideInRight 200ms ease-out",
        "slide-out-right": "slideOutRight 200ms ease-in",
        "slide-down": "slideDown 200ms ease-out",
        "slide-up": "slideUp 200ms ease-out",
        "scale-in": "scaleIn 150ms ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideOutRight: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        slideDown: {
          "0%": { transform: "translateY(-4px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(4px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      transitionDuration: {
        fast: "100ms",
        DEFAULT: "150ms",
        slow: "300ms",
      },
    },
  },
  plugins: [],
};
