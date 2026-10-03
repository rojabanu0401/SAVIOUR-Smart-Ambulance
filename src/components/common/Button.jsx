import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  style = {},
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'emergency':
        return {
          background: isHovered && !disabled
            ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
            : 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: isHovered && !disabled
            ? '0 0 24px rgba(239, 68, 68, 0.6)'
            : '0 4px 14px rgba(239, 68, 68, 0.4)',
        };
      case 'success':
        return {
          background: isHovered && !disabled
            ? 'linear-gradient(135deg, #15803d, #166534)'
            : 'linear-gradient(135deg, #10b981, #15803d)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: isHovered && !disabled
            ? '0 0 20px rgba(16, 185, 129, 0.5)'
            : '0 4px 14px rgba(16, 185, 129, 0.3)',
        };
      case 'outline':
        return {
          background: isHovered && !disabled ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
          color: '#38bdf8',
          border: '1.5px solid rgba(56, 189, 248, 0.5)',
          boxShadow: isHovered && !disabled ? '0 0 15px rgba(56, 189, 248, 0.3)' : 'none',
        };
      case 'secondary':
        return {
          background: isHovered && !disabled ? 'rgba(51, 65, 85, 0.8)' : 'rgba(30, 41, 59, 0.7)',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
        };
      case 'ghost':
        return {
          background: isHovered && !disabled ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          color: 'var(--slate-400)',
          border: '1px solid transparent',
          boxShadow: 'none',
        };
      case 'primary':
      default:
        return {
          background: isHovered && !disabled
            ? 'linear-gradient(135deg, #1d4ed8, #1e40af)'
            : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: isHovered && !disabled
            ? '0 0 22px rgba(37, 99, 235, 0.6)'
            : '0 4px 14px rgba(37, 99, 235, 0.35)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.45rem 0.85rem',
          fontSize: '0.8125rem',
          borderRadius: 'var(--radius-md)',
          gap: '0.4rem',
        };
      case 'lg':
        return {
          padding: '0.85rem 1.6rem',
          fontSize: '1rem',
          borderRadius: 'var(--radius-lg)',
          gap: '0.6rem',
        };
      case 'md':
      default:
        return {
          padding: '0.65rem 1.25rem',
          fontSize: '0.9rem',
          borderRadius: 'var(--radius-md)',
          gap: '0.5rem',
        };
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      className={className}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        letterSpacing: '0.01em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transform: isActive && !disabled ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
    >
      {loading ? (
        <>
          <LoadingSpinner size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 15 : size === 'lg' ? 20 : 18} />}
          {children}
          {IconRight && <IconRight size={size === 'sm' ? 15 : size === 'lg' ? 20 : 18} />}
        </>
      )}
    </button>
  );
};

export default Button;

