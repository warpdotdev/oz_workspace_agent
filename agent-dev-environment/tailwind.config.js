/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Base surfaces (dark theme)
        surface: {
          base: "#0A0A0B",
          raised: "#141415",
          elevated: "#1C1C1E",
          overlay: "#252528",
        },
        // Borders
        border: {
          subtle: "#2A2A2D",
          default: "#3A3A3D",
          strong: "#4A4A4D",
        },
        // Text
        text: {
          primary: "#EDEDEF",
          secondary: "#A0A0A5",
          tertiary: "#6B6B70",
          disabled: "#4A4A4D",
        },
        // Primary accent - Violet
        accent: {
          DEFAULT: "#6E56CF",
          hover: "#7C66DC",
          muted: "#6E56CF1A",
          subtle: "#6E56CF33",
        },
        // Agent status colors
        status: {
          running: "#30A46C",
          "running-muted": "#30A46C1A",
          errored: "#E5484D",
          "errored-muted": "#E5484D1A",
          deploying: "#F5A623",
          "deploying-muted": "#F5A6231A",
          paused: "#6E56CF",
          "paused-muted": "#6E56CF1A",
        },
        // Destructive
        destructive: {
          DEFAULT: "#E5484D",
          hover: "#F26369",
          muted: "#E5484D1A",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }], // 11px
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.8125rem", { lineHeight: "1.25rem" }], // 13px
        base: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        lg: ["1rem", { lineHeight: "1.5rem" }], // 16px
        xl: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
      },
      spacing: {
        // 4px grid system
        0.5: "2px",
        1: "4px",
        1.5: "6px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
      },
      boxShadow: {
        elevated: "0 4px 12px rgba(0, 0, 0, 0.4)",
        dialog: "0 8px 30px rgba(0, 0, 0, 0.6)",
        dropdown: "0 4px 16px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "slide-in-right": "slideInRight 200ms ease-out",
        "slide-out-right": "slideOutRight 200ms ease-in",
        "fade-in": "fadeIn 150ms ease-out",
        "fade-out": "fadeOut 150ms ease-in",
      },
      keyframes: {
        slideInRight: {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        slideOutRight: {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(100%)", opacity: "0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeOut: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      // Sidebar and panel widths
      width: {
        sidebar: "240px",
        "right-panel": "320px",
      },
    },
  },
  plugins: [],
};
