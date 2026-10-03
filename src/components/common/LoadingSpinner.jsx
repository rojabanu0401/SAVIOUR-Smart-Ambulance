import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 20, color = 'currentColor', className = '' }) => {
  return (
    <Loader2
      size={size}
      className={`animate-spin ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        color: color,
      }}
    />
  );
};

export default LoadingSpinner;
