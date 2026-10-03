import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({
  id,
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error,
  helperText,
  icon: Icon,
  placeholder = 'Select an option',
  className = '',
  style = {},
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const selectId = id || (name ? `select-${name}` : undefined);

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
          htmlFor={selectId}
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
          position: 'relative',
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

        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: value ? '#f8fafc' : '#64748b',
            fontSize: '0.925rem',
            fontWeight: 500,
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            paddingRight: '1.5rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            width: '100%',
          }}
        >
          <option value="" disabled style={{ background: '#0f172a', color: '#64748b' }}>
            {placeholder}
          </option>
          {options.map((opt) => {
            const optVal = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            return (
              <option
                key={optVal}
                value={optVal}
                style={{ background: '#0f172a', color: '#f8fafc', padding: '6px' }}
              >
                {optLabel}
              </option>
            );
          })}
        </select>

        <ChevronDown
          size={16}
          style={{
            position: 'absolute',
            right: '0.75rem',
            pointerEvents: 'none',
            color: '#94a3b8',
          }}
        />
      </div>

      {error ? (
        <span
          style={{
            fontSize: '0.78rem',
            color: '#f87171',
            fontWeight: 600,
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

export default Select;

