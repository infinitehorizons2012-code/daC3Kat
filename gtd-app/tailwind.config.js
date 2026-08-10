/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        'glass-bg': 'rgba(255, 255, 255, 0.5)',
        'glass-border': 'rgba(255, 255, 255, 0.4)',
      }
    },
  },
  plugins: [],
}
