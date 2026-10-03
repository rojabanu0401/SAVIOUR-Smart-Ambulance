import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  footer,
  variant = 'default',
  className = '',
  style = {},
  bodyStyle = {},
  onClick,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'emergency':
        return {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderTop: '4px solid #ef4444',
          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.15)',
        };
      case 'primary':
        return {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderTop: '4px solid #2563eb',
          boxShadow: '0 8px 30px rgba(37, 99, 235, 0.15)',
        };
      case 'elevated':
        return {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)',
        };
      case 'subtle':
        return {
          backgroundColor: 'rgba(11, 18, 32, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: 'none',
        };
      case 'default':
      default:
        return {
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'var(--shadow-md)',
        };
    }
  };

  return (
    <div
      onClick={onClick}
      className={`animate-fade-in ${className}`}
      style={{
        borderRadius: 'var(--radius-xl)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
        ...getVariantStyles(),
        ...style,
      }}
    >
      {(title || subtitle || Icon || badge || action) && (
        <div
          style={{
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '180px' }}>
            {Icon && (
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: variant === 'emergency' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                  color: variant === 'emergency' ? '#ef4444' : '#38bdf8',
                  border: variant === 'emergency' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
            )}
            <div>
              {title && (
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: '#f8fafc',
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--slate-400)',
                    marginTop: '2px',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {badge}
            {action}
          </div>
        </div>
      )}

      <div
        style={{
          padding: '1.35rem',
          ...bodyStyle,
        }}
      >
        {children}
      </div>

      {footer && (
        <div
          style={{
            padding: '0.85rem 1.4rem',
            backgroundColor: 'rgba(11, 17, 30, 0.7)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

