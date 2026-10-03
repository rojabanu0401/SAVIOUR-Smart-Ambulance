import React, { useState } from 'react';

export const Input = ({
  id,
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  icon: Icon,
  prefix,
  suffix,
  maxLength,
  autoComplete,
  className = '',
  style = {},
  inputStyle = {},
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || (name ? `input-${name}` : undefined);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
        textAlign: 'left',
        ...style,
      }}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.825rem',
            fontWeight: 700,
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: disabled ? 'rgba(15, 23, 42, 0.4)' : 'rgba(11, 18, 32, 0.85)',
          border: error
            ? '1.5px solid #ef4444'
            : isFocused
            ? '1.5px solid #38bdf8'
            : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-md)',
          boxShadow: isFocused
            ? error
              ? '0 0 0 3px rgba(239, 68, 68, 0.25)'
              : '0 0 0 3px rgba(56, 189, 248, 0.25)'
            : 'none',
          transition: 'all 0.15s ease',
          padding: '0 0.75rem',
          height: '46px',
        }}
      >
        {prefix && (
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#94a3b8',
              paddingRight: '0.5rem',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              marginRight: '0.6rem',
              userSelect: 'none',
            }}
          >
            {prefix}
          </span>
        )}

        {Icon && (
          <Icon
            size={18}
            style={{
              color: error ? '#ef4444' : isFocused ? '#38bdf8' : '#64748b',
              marginRight: '0.5rem',
              flexShrink: 0,
            }}
          />
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          autoComplete={autoComplete}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#f8fafc',
            fontSize: '0.925rem',
            fontWeight: 500,
            width: '100%',
            ...inputStyle,
          }}
          {...rest}
        />

        {suffix && (
          <span
            style={{
              fontSize: '0.85rem',
              color: '#94a3b8',
              marginLeft: '0.5rem',
            }}
          >
            {suffix}
          </span>
        )}
      </div>

      {error ? (
        <span
          style={{
            fontSize: '0.78rem',
            color: '#f87171',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {error}
        </span>
      ) : helperText ? (
        <span
          style={{
            fontSize: '0.75rem',
            color: '#64748b',
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
};

export default Input;

