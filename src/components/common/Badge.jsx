import React from 'react';

const VARIANTS = {
  blue: {
    bg: 'rgba(37, 99, 235, 0.18)',
    color: '#60a5fa',
    border: '1px solid rgba(59, 130, 246, 0.4)',
  },
  red: {
    bg: 'rgba(239, 68, 68, 0.18)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.4)',
  },
  green: {
    bg: 'rgba(16, 185, 129, 0.18)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.4)',
  },
  amber: {
    bg: 'rgba(245, 158, 11, 0.18)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.4)',
  },
  gray: {
    bg: 'rgba(51, 65, 85, 0.4)',
    color: '#cbd5e1',
    border: '1px solid rgba(100, 116, 139, 0.3)',
  },
};

export const Badge = ({
  children,
  variant = 'blue',
  size = 'md',
  dot = false,
  pulseDot = false,
  className = '',
  style = {},
}) => {
  const currentVariant = VARIANTS[variant] || VARIANTS.blue;

  const sizeStyles = {
    sm: { padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700 },
    md: { padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700 },
    lg: { padding: '6px 14px', fontSize: '0.85rem', fontWeight: 800 },
  }[size] || { padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700 };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: currentVariant.bg,
        color: currentVariant.color,
        border: currentVariant.border,
        letterSpacing: '0.02em',
        lineHeight: 1.2,
        ...sizeStyles,
        ...style,
      }}
    >
      {dot && (
        <span
          className={pulseDot ? (variant === 'red' ? 'pulse-emergency' : 'pulse-green') : ''}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: currentVariant.color,
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;

