/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        minecraft: {
          brown: '#8B4513',
          stone: '#7D7D7D',
          grass: '#7CB342',
          diamond: '#4FC3F7',
          gold: '#FFD54F',
        }
      },
      fontFamily: {
        'minecraft': ['"Minecraft"', 'monospace'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'minecraft': '0 4px 0px #5D4037, 0 0 0 1px #000000 inset',
        'minecraft-inset': 'inset 2px 2px 0px #5D4037',
      }
    },
  },
  plugins: [],
}