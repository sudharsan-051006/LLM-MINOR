/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'google-blue': '#1967D2',
        'google-green': '#137333',
        'google-yellow': '#F9AB00',
        'google-red': '#B31412',
        'g-grey': '#F1F3F4',
        'g-border': '#E0E0E0',
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}