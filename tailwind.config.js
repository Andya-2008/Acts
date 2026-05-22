/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './features/**/*.{js,jsx,ts,tsx}', './shared/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        acts: {
          canvas: 'rgb(var(--color-acts-canvas) / <alpha-value>)',
          surface: 'rgb(var(--color-acts-surface) / <alpha-value>)',
          muted: 'rgb(var(--color-acts-muted) / <alpha-value>)',
          ink: 'rgb(var(--color-acts-ink) / <alpha-value>)',
          /** Primary accent (class name `acts-green` is historical) */
          green: 'rgb(var(--color-acts-green) / <alpha-value>)',
          'green-soft': 'rgb(var(--color-acts-green-soft) / <alpha-value>)',
          blue: 'rgb(var(--color-acts-blue) / <alpha-value>)',
          'blue-soft': 'rgb(var(--color-acts-blue-soft) / <alpha-value>)',
          border: 'rgb(var(--color-acts-border) / <alpha-value>)',
          danger: 'rgb(var(--color-acts-danger) / <alpha-value>)',
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
