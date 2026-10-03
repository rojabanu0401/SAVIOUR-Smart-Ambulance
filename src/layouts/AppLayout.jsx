import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import { ShieldCheck, HeartPulse, Radio } from 'lucide-react';

export const AppLayout = () => {
  const location = useLocation();
  const isDriverDashboard = location.pathname.includes('/driver/dashboard');
  const isDriverNavigation = location.pathname.includes('/driver/navigation');
  const isFullBleed = isDriverDashboard || isDriverNavigation;

  return (
    <div
      style={{
        minHeight: '100vh',
        height: isDriverNavigation ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#080C14',
        color: '#f8fafc',
        overflow: isDriverNavigation ? 'hidden' : 'visible',
      }}
    >
      {!isDriverNavigation && <Header />}

      <main
        style={{
          flex: 1,
          padding: isDriverNavigation
            ? '0'
            : isDriverDashboard
            ? '0.85rem 1rem'
            : '1.75rem 1.25rem',
          maxWidth: isFullBleed ? '100%' : '1360px',
          margin: '0 auto',
          width: '100%',
          height: isDriverNavigation ? '100vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: isDriverNavigation ? 'hidden' : 'visible',
        }}
      >
        <Outlet />
      </main>

      {!isFullBleed && !isDriverNavigation && (
        <footer
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: 'rgba(11, 17, 30, 0.9)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.8125rem',
            color: 'var(--slate-400)',
          }}
        >
          <div
            style={{
              maxWidth: '1360px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#f8fafc' }}>
                <HeartPulse size={15} color="#ef4444" />
                SAVIOUR Smart Ambulance Emergency Navigation
              </span>
              <span>&bull;</span>
              <span>Priority Signal Preemption</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Radio size={14} color="#10b981" />
                Real-Time Traffic Sync
              </span>
              <span>&bull;</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="#38bdf8" />
                100% Verified Fleet
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default AppLayout;
