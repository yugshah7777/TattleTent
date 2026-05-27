/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Government of India - Institutional Color Palette
        goi: {
          // Primary: Deep Teal/Navy (authority, trust)
          navy: '#0f4c45',
          'navy-50': '#f0fffe',
          'navy-100': '#d4f4f1',
          'navy-200': '#a9e9e3',
          'navy-300': '#7eddd5',
          'navy-400': '#53d2c7',
          'navy-600': '#0a3a33',
          'navy-700': '#082f2a',
          'navy-800': '#051f19',
          // Secondary: Professional Slate
          slate: '#475569',
          'slate-50': '#f8fafc',
          'slate-100': '#f1f5f9',
          'slate-200': '#e2e8f0',
          'slate-300': '#cbd5e1',
          'slate-600': '#334155',
          'slate-700': '#1e293b',
          'slate-900': '#0f172a',
          // Accent: Vibrant Blue (action, trust)
          blue: '#0369a1',
          'blue-50': '#f0f9ff',
          'blue-100': '#e0f2fe',
          'blue-200': '#bae6fd',
          'blue-300': '#7dd3fc',
          'blue-600': '#0284c7',
          'blue-700': '#0369a1',
          'blue-900': '#082f49',
          // Success: Green (achievement)
          success: '#059669',
          'success-50': '#f0fdf4',
          'success-100': '#dcfce7',
          'success-200': '#bbf7d0',
          'success-600': '#16a34a',
          'success-700': '#15803d',
          // Warning: Amber (attention)
          warning: '#d97706',
          'warning-50': '#fffbeb',
          'warning-100': '#fef3c7',
          'warning-200': '#fde68a',
          'warning-600': '#ca8a04',
          'warning-700': '#b45309',
          // Error: Red (critical)
          error: '#dc2626',
          'error-50': '#fef2f2',
          'error-100': '#fee2e2',
          'error-200': '#fecaca',
          'error-600': '#e11d48',
          'error-700': '#be123c',
        },
        // Maintain backwards compatibility
        primary: {
          DEFAULT: '#0f4c45',
          50: '#f0fffe',
          100: '#d4f4f1',
          200: '#a9e9e3',
          300: '#7eddd5',
          400: '#53d2c7',
          500: '#28c7b9',
          600: '#0a3a33',
          700: '#082f2a',
          800: '#051f19',
          900: '#031814',
          950: '#020d0a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#082f49',
          950: '#051e3e',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
      },
      // Typography
      fontSize: {
        // Heroic scales
        'display-xl': ['3.5rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.01em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['1.875rem', { lineHeight: '1.25', fontWeight: '700' }],
        // Body scales
        'xl': ['1.25rem', { lineHeight: '1.5', fontWeight: '500' }],
        'lg': ['1.125rem', { lineHeight: '1.5', fontWeight: '500' }],
        'base': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'sm': ['0.875rem', { lineHeight: '1.4', fontWeight: '400' }],
        'xs': ['0.75rem', { lineHeight: '1.2', fontWeight: '600' }],
      },
      // Premium spacing scale (8px grid)
      spacing: {
        '0': '0',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '60': '240px',
        '64': '256px',
        '72': '288px',
        '80': '320px',
        '96': '384px',
      },
      // Border radius system
      borderRadius: {
        'none': '0',
        'xs': '4px',
        'sm': '6px',
        'base': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
      },
      // Premium shadow system (elevation-based)
      boxShadow: {
        // Elevation system
        'elevation-1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'elevation-5': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        // Semantic shadows
        'soft': '0 2px 15px -3px rgba(15, 23, 42, 0.07), 0 10px 20px -2px rgba(15, 23, 42, 0.04)',
        'medium': '0 4px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 30px -5px rgba(15, 23, 42, 0.05)',
        'strong': '0 10px 40px -10px rgba(15, 23, 42, 0.15), 0 20px 50px -10px rgba(15, 23, 42, 0.1)',
        // Focus ring shadows
        'focus-ring': '0 0 0 3px rgba(15, 76, 69, 0.1), 0 0 0 5px rgba(15, 76, 69, 0.05)',
        'focus-ring-primary': '0 0 0 3px rgba(15, 76, 69, 0.15)',
        'focus-ring-error': '0 0 0 3px rgba(220, 38, 38, 0.15)',
      },
      // Premium animations
      animation: {
        // Entrance
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-left': 'slideLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        // Subtle
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        // Loading/states
        'spin-slow': 'spin 1.5s linear infinite',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        // Entrance animations
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        // Subtle animations
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        // Loading animations
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(15, 76, 69, 0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(15, 76, 69, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(15, 76, 69, 0)' },
        },
      },
      // Gradient backgrounds
      backgroundImage: {
        'gradient-goi-primary': 'linear-gradient(135deg, #0f4c45 0%, #082f2a 100%)',
        'gradient-goi-accent': 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
        'gradient-success': 'linear-gradient(135deg, #059669 0%, #15803d 100%)',
        'gradient-warning': 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        'gradient-error': 'linear-gradient(135deg, #dc2626 0%, #be123c 100%)',
        'gradient-primary': 'linear-gradient(135deg, #0f4c45 0%, #082f2a 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(15, 76, 69, 0.08), transparent 50%)',
      },
      // Transition timing
      transitionDuration: {
        'ultrafast': '100ms',
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
}