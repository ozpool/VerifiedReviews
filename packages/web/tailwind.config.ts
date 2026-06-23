import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // --- Editorial Trust design tokens ---
      fontFamily: {
        // Display: Fraunces — optical serif, confident, editorial
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        // Body: DM Sans — clean grotesque, readable, not Inter
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Receipt paper off-white
        paper: '#F9F6F1',
        // Near-black ink
        ink: '#1A1A18',
        // Stamp/receipt accent — warm amber-orange
        accent: {
          DEFAULT: '#D4541A',
          light: '#F0784A',
          muted: '#F2E0D6',
        },
        // Structural grays on warm base
        border: '#D9D3C8',
        muted: '#6B6560',
        subtle: '#EAE6DF',
      },
      borderRadius: {
        // Slightly less round than defaults — more editorial
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      // Generous whitespace scale
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease both',
        'fade-in': 'fadeIn 0.2s ease both',
      },
    },
  },
  plugins: [],
};

export default config;
