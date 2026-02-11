/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Agent status colors
        'status-running': '#10B981', // green
        'status-error': '#EF4444',   // red
        'status-idle': '#6B7280',    // gray
        'status-paused': '#3B82F6',  // blue
      },
    },
  },
  plugins: [],
}
