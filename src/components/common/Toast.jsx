import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({
  message,
  type = 'success',
  title,
  onClose,
  duration = 4000,
  className = '',
}) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: AlertCircle,
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#fca5a5',
          iconColor: '#ef4444',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bg: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#fde68a',
          iconColor: '#f59e0b',
        };
      case 'info':
        return {
          icon: Info,
          bg: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          color: '#bae6fd',
          iconColor: '#38bdf8',
        };
      case 'success':
      default:
        return {
          icon: CheckCircle2,
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#a7f3d0',
          iconColor: '#10b981',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1.125rem',
        backgroundColor: config.bg,
        border: config.border,
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        color: config.color,
        marginBottom: '1rem',
        textAlign: 'left',
      }}
    >
      <Icon size={20} style={{ color: config.iconColor, flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        {title && <h5 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '2px', color: '#ffffff' }}>{title}</h5>}
        <p style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4, margin: 0 }}>{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;

