/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'robin-dark': '#1a1a1a',
        'robin-card': '#252525',
        'robin-green': '#00b894',
        'robin-red': '#d63031',
      }
    },
  },
  plugins: [],
}