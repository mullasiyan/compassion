/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#03060E',
          900: '#060A17',
          850: '#090E1C',
          800: '#10172A',
          700: '#1A2744',
        },
        agent: {
          orchestrator: '#00F0FF',
          report: '#38BDF8',
          verification: '#FFB800',
          search: '#A855F7',
          rescue: '#00FF9D',
          family: '#FF007A',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px rgba(0, 240, 255, 0.35)',
        'glow-lime': '0 0 25px rgba(0, 255, 157, 0.35)',
        'glow-violet': '0 0 25px rgba(168, 85, 247, 0.35)',
        'glow-amber': '0 0 25px rgba(255, 184, 0, 0.35)',
        'glow-magenta': '0 0 25px rgba(255, 0, 122, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
