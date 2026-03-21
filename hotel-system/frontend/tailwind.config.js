/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          500: '#facc15',
          600: '#eab308',
          700: '#ca8a04',
        },
        secondary: '#f1f5f9',
        dark: '#1e293b'
      }
    },
  },
  plugins: [],
}
