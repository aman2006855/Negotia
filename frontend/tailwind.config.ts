import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SFMono-Regular', 'Consolas', 'monospace'],
      },
      colors: {
        canvas: 'hsl(var(--color-canvas))',
        surface: 'hsl(var(--color-surface))',
        elevated: 'hsl(var(--color-elevated))',
        inset: 'hsl(var(--color-inset))',
        'border-subtle': 'hsl(var(--color-border-subtle))',
        'border-strong': 'hsl(var(--color-border-strong))',
        'txt-primary': 'hsl(var(--color-txt-primary))',
        'txt-secondary': 'hsl(var(--color-txt-secondary))',
        'txt-tertiary': 'hsl(var(--color-txt-tertiary))',
        accent: {
          50: 'hsl(var(--color-accent-50) / <alpha-value>)',
          100: 'hsl(var(--color-accent-100) / <alpha-value>)',
          200: 'hsl(var(--color-accent-200) / <alpha-value>)',
          400: 'hsl(var(--color-accent-400) / <alpha-value>)',
          500: 'hsl(var(--color-accent-500) / <alpha-value>)',
          600: 'hsl(var(--color-accent-600) / <alpha-value>)',
          700: 'hsl(var(--color-accent-700) / <alpha-value>)',
        },
        success: {
          50: 'hsl(var(--color-success-50) / <alpha-value>)',
          500: 'hsl(var(--color-success-500) / <alpha-value>)',
          600: 'hsl(var(--color-success-600) / <alpha-value>)',
        },
        warning: {
          50: 'hsl(var(--color-warning-50) / <alpha-value>)',
          500: 'hsl(var(--color-warning-500) / <alpha-value>)',
          600: 'hsl(var(--color-warning-600) / <alpha-value>)',
        },
        danger: {
          50: 'hsl(var(--color-danger-50) / <alpha-value>)',
          500: 'hsl(var(--color-danger-500) / <alpha-value>)',
          600: 'hsl(var(--color-danger-600) / <alpha-value>)',
        },
      },
      boxShadow: {
        soft: '0 1px 2px hsla(224,30%,10%,0.06), 0 8px 20px hsla(224,30%,10%,0.04)',
        medium: '0 2px 6px hsla(224,30%,10%,0.08), 0 12px 28px hsla(224,30%,10%,0.06)',
        strong: '0 6px 16px hsla(224,30%,10%,0.10), 0 24px 48px hsla(224,30%,10%,0.08)',
        'soft-dark': '0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 24px rgba(0,0,0,0.24), 0 32px 64px rgba(0,0,0,0.18)',
        'medium-dark': '0 2px 0 rgba(255,255,255,0.04) inset, 0 16px 32px rgba(0,0,0,0.3), 0 48px 80px rgba(0,0,0,0.2)',
        nav: '0 -1px 3px hsla(224,30%,10%,0.06), 0 -8px 24px hsla(224,30%,10%,0.04)',
        'nav-dark': '0 -1px 0 rgba(255,255,255,0.04) inset, 0 -12px 24px rgba(0,0,0,0.2)',
      },
      borderRadius: { sm: '0.375rem', md: '0.625rem', lg: '0.875rem', xl: '1.125rem', '2xl': '1.25rem', '3xl': '1.5rem' },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-8px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
};
export default config;
