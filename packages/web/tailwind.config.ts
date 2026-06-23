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
        // Mascot idle: a perpetual gentle breathe + tilt.
        mascotIdle: {
          '0%, 100%': { transform: 'translateY(0) rotate(-2.5deg)' },
          '50%': { transform: 'translateY(-3px) rotate(2.5deg)' },
        },
        // One-shot flourishes, retriggered by remounting the figure.
        mascotHop: {
          '0%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-9px)' },
        },
        mascotWiggle: {
          '0%, 100%': { transform: 'rotate(0)' },
          '25%': { transform: 'rotate(-12deg)' },
          '75%': { transform: 'rotate(12deg)' },
        },
        mascotJump: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '35%': { transform: 'translateY(-16px) scale(1.08)' },
          '60%': { transform: 'translateY(0) scale(0.94)' },
        },
        // Click sparkle: fly out along --dx/--dy, fade, shrink.
        sparkle: {
          from: { transform: 'translate(0,0) scale(1)', opacity: '1' },
          to: { transform: 'translate(var(--dx), var(--dy)) scale(0)', opacity: '0' },
        },
        // Ambient drift for the detail hero pattern.
        patternDrift: {
          '0%, 100%': { transform: 'translateX(0) translateY(0)' },
          '50%': { transform: 'translateX(-6px) translateY(3px)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease both',
        'fade-in': 'fadeIn 0.2s ease both',
        'mascot-idle': 'mascotIdle 3s ease-in-out infinite',
        'mascot-hop': 'mascotHop 0.5s ease',
        'mascot-wiggle': 'mascotWiggle 0.5s ease',
        'mascot-jump': 'mascotJump 0.6s ease',
        sparkle: 'sparkle 0.65s ease-out forwards',
        'pattern-drift': 'patternDrift 12s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
