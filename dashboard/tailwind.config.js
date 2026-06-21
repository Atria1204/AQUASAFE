/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#030712',
        surface: '#0f172a',
        primary: '#06b6d4',
        secondary: '#3b82f6'
      }
    },
  },
  plugins: [],
}