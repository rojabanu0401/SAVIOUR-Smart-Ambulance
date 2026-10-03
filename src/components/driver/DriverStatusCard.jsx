import React from 'react';
import { Truck } from 'lucide-react';

export const DriverStatusCard = ({ status = 'Available' }) => {
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      maxWidth: '320px',
      margin: '1rem auto'
    }}>
      <Truck size={28} color="#16a34a" />
      <div style={{ textAlign: 'left' }}>
        <p style={{ fontWeight: 'bold', margin: 0 }}>Ambulance Status</p>
        <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>Status: {status}</span>
      </div>
    </div>
  );
};

export default DriverStatusCard;
