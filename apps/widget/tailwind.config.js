/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './embed.html'],
  prefix: 'tw-', // Prefix to avoid conflicts with parent site
  important: '#tekassist-widget-root', // Scope styles to widget container
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--tekassist-primary-50, #eff6ff)',
          100: 'var(--tekassist-primary-100, #dbeafe)',
          200: 'var(--tekassist-primary-200, #bfdbfe)',
          300: 'var(--tekassist-primary-300, #93c5fd)',
          400: 'var(--tekassist-primary-400, #60a5fa)',
          500: 'var(--tekassist-primary-500, #3b82f6)',
          600: 'var(--tekassist-primary-600, #2563eb)',
          700: 'var(--tekassist-primary-700, #1d4ed8)',
          800: 'var(--tekassist-primary-800, #1e40af)',
          900: 'var(--tekassist-primary-900, #1e3a8a)',
        },
        secondary: {
          50: 'var(--tekassist-secondary-50, #f8fafc)',
          100: 'var(--tekassist-secondary-100, #f1f5f9)',
          200: 'var(--tekassist-secondary-200, #e2e8f0)',
          300: 'var(--tekassist-secondary-300, #cbd5e1)',
          400: 'var(--tekassist-secondary-400, #94a3b8)',
          500: 'var(--tekassist-secondary-500, #64748b)',
          600: 'var(--tekassist-secondary-600, #475569)',
          700: 'var(--tekassist-secondary-700, #334155)',
          800: 'var(--tekassist-secondary-800, #1e293b)',
          900: 'var(--tekassist-secondary-900, #0f172a)',
        },
        accent: {
          50: 'var(--tekassist-accent-50, #fef2f2)',
          100: 'var(--tekassist-accent-100, #fee2e2)',
          200: 'var(--tekassist-accent-200, #fecaca)',
          300: 'var(--tekassist-accent-300, #fca5a5)',
          400: 'var(--tekassist-accent-400, #f87171)',
          500: 'var(--tekassist-accent-500, #ef4444)',
          600: 'var(--tekassist-accent-600, #dc2626)',
          700: 'var(--tekassist-accent-700, #b91c1c)',
          800: 'var(--tekassist-accent-800, #991b1b)',
          900: 'var(--tekassist-accent-900, #7f1d1d)',
        },
        success: {
          50: 'var(--tekassist-success-50, #f0fdf4)',
          100: 'var(--tekassist-success-100, #dcfce7)',
          200: 'var(--tekassist-success-200, #bbf7d0)',
          300: 'var(--tekassist-success-300, #86efac)',
          400: 'var(--tekassist-success-400, #4ade80)',
          500: 'var(--tekassist-success-500, #22c55e)',
          600: 'var(--tekassist-success-600, #16a34a)',
          700: 'var(--tekassist-success-700, #15803d)',
          800: 'var(--tekassist-success-800, #166534)',
          900: 'var(--tekassist-success-900, #14532d)',
        },
        warning: {
          50: 'var(--tekassist-warning-50, #fffbeb)',
          100: 'var(--tekassist-warning-100, #fef3c7)',
          200: 'var(--tekassist-warning-200, #fde68a)',
          300: 'var(--tekassist-warning-300, #fcd34d)',
          400: 'var(--tekassist-warning-400, #fbbf24)',
          500: 'var(--tekassist-warning-500, #f59e0b)',
          600: 'var(--tekassist-warning-600, #d97706)',
          700: 'var(--tekassist-warning-700, #b45309)',
          800: 'var(--tekassist-warning-800, #92400e)',
          900: 'var(--tekassist-warning-900, #78350f)',
        },
      },
      fontFamily: {
        sans: [
          'var(--tekassist-font-family, ui-sans-serif)',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
      borderRadius: {
        widget: 'var(--tekassist-border-radius, 0.75rem)',
      },
      boxShadow: {
        widget:
          'var(--tekassist-shadow, 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
        'widget-lg':
          'var(--tekassist-shadow-lg, 0 25px 50px -12px rgba(0, 0, 0, 0.25))',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'pulse-gentle': 'pulseGentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [
    function ({ addBase, addUtilities }) {
      addBase({
        '#tekassist-widget-root': {
          '--tekassist-z-index': '9999',
          fontFamily:
            'var(--tekassist-font-family, ui-sans-serif, system-ui, sans-serif)',
          fontSize: '14px',
          lineHeight: '1.5',
          color: 'var(--tekassist-text-color, #1f2937)',
          backgroundColor: 'var(--tekassist-background-color, #ffffff)',
        },
      });

      addUtilities({
        '.widget-container': {
          position: 'fixed',
          zIndex: 'var(--tekassist-z-index, 9999)',
          fontFamily: 'inherit',
        },
        '.widget-shadow': {
          boxShadow:
            'var(--tekassist-shadow, 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
        },
        '.widget-border': {
          borderRadius: 'var(--tekassist-border-radius, 0.75rem)',
        },
      });
    },
  ],
};
