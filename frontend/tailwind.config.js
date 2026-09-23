/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: 'var(--text)',
        textMuted: 'var(--text-muted)',
        accent: 'var(--accent)',
        accentHover: 'var(--accent-hover)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        critical: 'var(--critical)',
        info: 'var(--info)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        lg: ['16px', '24px'],
        xl: ['18px', '26px'],
        '2xl': ['22px', '28px'],
        '3xl': ['28px', '34px'],
      },
      spacing: {
        // Strict 8px grid
        '0': '0px',
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '7': '56px',
        '8': '64px',
        '9': '72px',
        '10': '80px',
        '12': '96px',
        '16': '128px',
      },
      borderRadius: {
        card: '8px',
        input: '6px',
        btn: '6px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
        fast: '150ms',
        normal: '200ms',
        slow: '250ms',
      },
    },
  },
  plugins: [],
};
