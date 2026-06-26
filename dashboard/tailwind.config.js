/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#030712',        // Latar belakang terdalam halaman
        'bg-overlay': '#0a0f1a',      // Latar belakang luar modal/backdrop blur
        'surface-card': '#131b2c',    // Latar belakang utama card sensor & pakan
        surface: '#0f172a',           // Permukaan standar
        primary: '#06b6d4',           // Cyan utama untuk aksen aktif
        secondary: '#3b82f6'          // Biru sekunder
      }
    },
  },
  plugins: [],
}
