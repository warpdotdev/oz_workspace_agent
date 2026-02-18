/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4A90D9',
        success: '#34C759',
        accent: '#FF6B6B',
        bgMain: '#FAFAFA',
        bgCard: '#FFFFFF',
        textPrimary: '#1A1A1A',
        textSecondary: '#6B6B6B',
      },
    },
  },
  plugins: [],
}
