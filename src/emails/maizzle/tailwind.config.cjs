/**
 * Tailwind CSS configuration for Maizzle email templates
 * Optimized for email client compatibility
 */

module.exports = {
  content: ['./src/**/*.html'],

  theme: {
    extend: {
      // Email-safe fonts
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },

      // Brand colors
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
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
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        warning: {
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
        },
      },

      // Email-safe spacing
      spacing: {
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
        24: '96px',
        32: '128px',
      },

      // Email-safe border radius
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },

      // Email-safe shadows (use sparingly)
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },

  // Plugins for additional utilities
  plugins: [
    // Add custom utilities for email
    function ({ addUtilities, theme }) {
      const emailUtilities = {
        // Email-safe table utilities
        '.table-fixed-layout': {
          'table-layout': 'fixed',
        },
        '.table-auto-layout': {
          'table-layout': 'auto',
        },

        // MSO specific utilities
        '.mso-hide': {
          'mso-hide': 'all',
          display: 'none',
        },

        // Outlook specific utilities
        '.outlook-hide': {
          display: 'none',
          'mso-hide': 'all',
        },

        // Email client compatibility
        '.email-body': {
          margin: '0',
          padding: '0',
          width: '100%',
          'background-color': '#f4f4f4',
          'font-family': theme('fontFamily.sans').join(', '),
        },

        '.email-container': {
          'max-width': '600px',
          margin: '0 auto',
          'background-color': '#ffffff',
        },

        // Button styles optimized for email
        '.email-button': {
          display: 'inline-block',
          padding: '12px 24px',
          'background-color': theme('colors.primary.600'),
          color: '#ffffff',
          'text-decoration': 'none',
          'border-radius': theme('borderRadius.md'),
          'font-weight': '600',
          'text-align': 'center',
          'mso-padding-alt': '0',
          'mso-text-raise': '15px',
        },

        // Responsive utilities for email
        '.email-responsive': {
          width: '100%',
          'max-width': '600px',
        },
      };

      addUtilities(emailUtilities);
    },
  ],

  // Purge configuration
  purge: {
    // Don't purge these classes as they might be used dynamically
    safelist: [
      'text-primary-500',
      'text-secondary-500',
      'text-success-500',
      'text-danger-500',
      'text-warning-500',
      'bg-primary-500',
      'bg-secondary-500',
      'bg-success-500',
      'bg-danger-500',
      'bg-warning-500',
      'border-primary-500',
      'border-secondary-500',
      'border-success-500',
      'border-danger-500',
      'border-warning-500',
    ],
  },

  // Important for email client specificity
  important: true,

  // Prefix for CSS classes (if needed)
  prefix: '',

  // Dark mode configuration (limited support in email)
  darkMode: false,
};
