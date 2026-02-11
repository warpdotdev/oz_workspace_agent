/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // AgentOS Design System - Dark Mode Primary
        background: {
          primary: "#0D0D0D",
          secondary: "#1A1A1A",
          tertiary: "#262626",
          elevated: "#2D2D2D",
        },
        surface: {
          DEFAULT: "#1A1A1A",
          hover: "#262626",
          active: "#333333",
        },
        border: {
          DEFAULT: "#333333",
          subtle: "#262626",
          strong: "#404040",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#A3A3A3",
          tertiary: "#737373",
          disabled: "#525252",
        },
        // Status colors for agent states
        status: {
          running: "#22C55E", // green
          error: "#EF4444", // red
          idle: "#6B7280", // gray
          paused: "#3B82F6", // blue
          pending: "#F59E0B", // amber
        },
        // Accent colors
        accent: {
          primary: "#6366F1", // indigo
          secondary: "#8B5CF6", // violet
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "system-ui",
          "sans-serif",
        ],
        mono: ["SF Mono", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      spacing: {
        sidebar: "240px",
        activity: "320px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
