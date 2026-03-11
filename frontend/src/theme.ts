export const theme = {
  colors: {
    bg: '#0b1120',
    surface: '#1a2332',
    surfaceHover: '#1f2b3d',
    border: '#2a3a4e',
    borderFocus: '#3b82f6',

    primary: '#2563eb',
    primaryHover: '#3b82f6',
    primaryActive: '#1d4ed8',

    danger: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',

    text: '#f1f5f9',
    textMuted: '#94a3b8',
    textPlaceholder: '#64748b',

    inputBg: '#0f1729',
    inputBorder: '#2a3a4e',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  font: {
    family: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
    sizeXs: '0.75rem',
    sizeSm: '0.875rem',
    sizeMd: '1rem',
    sizeLg: '1.125rem',
    sizeXl: '1.5rem',
    sizeXxl: '2rem',
  },
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
  },
} as const

export type Theme = typeof theme
