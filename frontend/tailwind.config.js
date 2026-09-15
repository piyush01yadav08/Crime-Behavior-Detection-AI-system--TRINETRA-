/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        trinetra: {
          bg: "#050811",
          panel: "#0a0f1d",
          panelDark: "#060a14",
          card: "#0d1527",
          border: "#17233d",
          borderGlow: "rgba(0, 229, 255, 0.25)",
          cyan: "#00e5ff",
          cyanHover: "#33edff",
          blue: "#0070f3",
          navy: "#0a192f",
          muted: "#8892b0",
          text: "#e2e8f0",
          low: "#10b981",
          medium: "#f59e0b",
          high: "#f97316",
          critical: "#ef4444",
        }
      },
      boxShadow: {
        'cyan-glow': '0 0 20px -3px rgba(0, 229, 255, 0.35)',
        'cyan-glow-lg': '0 0 35px -2px rgba(0, 229, 255, 0.45)',
        'card-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'red-glow': '0 0 20px -3px rgba(239, 68, 68, 0.4)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'pulse-slow': 'pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radarSweep 8s linear infinite',
      }
    },
  },
  plugins: [],
}
