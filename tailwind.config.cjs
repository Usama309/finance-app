/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        safe: { 50: "#f0fdf4", 100: "#dcfce7", 500: "#22c55e", 600: "#16a34a" },
        warn: { 50: "#fefce8", 100: "#fef9c3", 500: "#eab308", 600: "#ca8a04" },
        danger: { 50: "#fef2f2", 100: "#fee2e2", 500: "#ef4444", 600: "#dc2626" },
      },
    },
  },
  plugins: [],
};
