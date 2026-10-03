import React from 'react';
import { AlertCircle } from 'lucide-react';

export const EmergencyButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: '#dc2626',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 'bold',
        cursor: 'pointer',
      }}
    >
      <AlertCircle size={20} />
      <span>Trigger Emergency SOS</span>
    </button>
  );
};

export default EmergencyButton;
