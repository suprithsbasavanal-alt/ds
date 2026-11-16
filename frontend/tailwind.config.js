/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aeris: {
          dark: '#080C14',
          card: '#0D1424',
          cardLight: '#141F36',
          border: '#1F2E4D',
          cyan: '#00F0FF',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          good: '#10B981',
          satisfactory: '#84CC16',
          moderate: '#FBBF24',
          poor: '#F97316',
          veryPoor: '#EF4444',
          severe: '#991B1B'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.2), 0 0 10px rgba(0, 240, 255, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.6), 0 0 30px rgba(0, 240, 255, 0.2)' }
        }
      }
    },
  },
  plugins: [],
}
