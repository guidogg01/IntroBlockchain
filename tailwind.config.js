/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',   // <- habilita dark mode vía clase .dark
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
