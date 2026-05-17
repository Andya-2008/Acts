/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './features/**/*.{js,jsx,ts,tsx}', './shared/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        acts: {
          canvas: '#FFF7FB',
          surface: '#FFFFFF',
          muted: '#8B6F82',
          ink: '#2D1528',
          /** Primary accent (vibrant pink — app uses `acts-green` class name for history) */
          green: '#E11D74',
          'green-soft': '#FCE3F0',
          /** Bluish accent */
          blue: '#5B6BE8',
          'blue-soft': '#E8ECFF',
          border: '#F1C9E0',
          danger: '#DC2626',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        card: '0 8px 24px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
