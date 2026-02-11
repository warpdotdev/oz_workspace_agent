import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        // Status colors
        status: {
          running: "#22C55E",
          error: "#EF4444",
          idle: "#6B7280",
          paused: "#3B82F6",
          pending: "#F59E0B",
        },
        // Accent colors
        accent: {
          primary: "#6366F1",
          secondary: "#8B5CF6",
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
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(99, 102, 241, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
