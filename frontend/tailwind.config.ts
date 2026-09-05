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
        canvas: { DEFAULT: 'hsl(220 23% 98%)', dark: 'hsl(220 14% 8%)' },
        surface: { DEFAULT: 'hsl(0 0% 100%)', dark: 'hsl(220 14% 12%)' },
        elevated: { DEFAULT: 'hsl(0 0% 100%)', dark: 'hsl(220 14% 16%)' },
        inset: { DEFAULT: 'hsl(220 18% 94%)', dark: 'hsl(220 14% 18%)' },
        'border-subtle': { DEFAULT: 'hsl(220 16% 90%)', dark: 'hsl(220 14% 22%)' },
        'border-strong': { DEFAULT: 'hsl(220 14% 82%)', dark: 'hsl(220 14% 28%)' },
        'txt-primary': { DEFAULT: 'hsl(224 28% 14%)', dark: 'hsl(0 0% 95%)' },
        'txt-secondary': { DEFAULT: 'hsl(220 12% 37%)', dark: 'hsl(220 10% 65%)' },
        'txt-tertiary': { DEFAULT: 'hsl(220 10% 50%)', dark: 'hsl(220 8% 48%)' },
        accent: {
          50: 'hsl(230 100% 98%)',
          100: 'hsl(228 100% 96%)',
          200: 'hsl(226 90% 92%)',
          400: 'hsl(232 78% 68%)',
          500: 'hsl(231 85% 63%)',
          600: 'hsl(233 74% 57%)',
          700: 'hsl(235 69% 50%)',
          dark: {
            50: 'hsl(230 40% 20%)',
            100: 'hsl(228 35% 25%)',
            500: 'hsl(231 60% 55%)',
            600: 'hsl(233 65% 60%)',
          },
        },
        success: { 50: 'hsl(145 64% 96%)', 500: 'hsl(142 71% 45%)', 600: 'hsl(142 72% 35%)' },
        warning: { 50: 'hsl(48 100% 96%)', 500: 'hsl(38 92% 50%)', 600: 'hsl(38 80% 44%)' },
        danger: { 50: 'hsl(0 86% 97%)', 500: 'hsl(0 84% 60%)', 600: 'hsl(0 72% 51%)' },
      },
      boxShadow: {
        soft: '0 1px 2px hsla(224,30%,10%,0.06), 0 8px 20px hsla(224,30%,10%,0.04)',
        medium: '0 2px 6px hsla(224,30%,10%,0.08), 0 12px 28px hsla(224,30%,10%,0.06)',
        strong: '0 6px 16px hsla(224,30%,10%,0.10), 0 24px 48px hsla(224,30%,10%,0.08)',
        'soft-dark': '0 1px 0 rgba(255,255,255,0.06) inset, 0 12px 24px rgba(0,0,0,0.24), 0 32px 64px rgba(0,0,0,0.18)',
        'medium-dark': '0 2px 0 rgba(255,255,255,0.04) inset, 0 16px 32px rgba(0,0,0,0.3), 0 48px 80px rgba(0,0,0,0.2)',
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
