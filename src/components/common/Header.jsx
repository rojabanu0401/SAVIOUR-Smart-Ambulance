import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Siren, Home, User, Truck, LogOut, ShieldCheck, Activity, HeartPulse, Radio } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Badge from './Badge';
import Button from './Button';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { commonUser, driver, logoutCommon, logoutDriver } = useAuth();

  const handleLogout = () => {
    if (driver) {
      logoutDriver();
      navigate('/driver/login');
    } else if (commonUser) {
      logoutCommon();
      navigate('/common/login');
    }
  };

  const isLanding = location.pathname === '/';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'rgba(8, 12, 20, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        padding: '0.75rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: SAVIOUR Brand Logo & Title */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
              color: '#ffffff',
            }}
          >
            <Siren size={22} className="pulse-siren" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                SAVIOUR
              </span>
              <Badge variant="red" size="sm" dot pulseDot>
                LIVE DISPATCH
              </Badge>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--slate-400)', fontWeight: 600, letterSpacing: '0.02em' }}>
              Smart Ambulance Navigation & Priority Traffic Preemption
            </p>
          </div>
        </Link>

        {/* Right: Active Session Badges / Nav Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Active Session Status */}
          {driver ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <Truck size={16} color="#38bdf8" />
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                    {driver.fullName || 'Ambulance Driver'}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                    {driver.ambulanceNumber || 'Unit Active'}
                  </span>
                </div>
              </div>

              <Badge variant={driver.isOnline ? 'green' : 'gray'} size="sm" dot pulseDot={driver.isOnline}>
                {driver.isOnline ? 'ONLINE' : 'STANDBY'}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                icon={LogOut}
                onClick={handleLogout}
                style={{ color: '#94a3b8' }}
              >
                Logout
              </Button>
            </div>
          ) : commonUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <User size={16} color="#38bdf8" />
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                    {commonUser.name || 'Citizen'}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                    {commonUser.phone ? `+91 ${commonUser.phone}` : 'Citizen Account'}
                  </span>
                </div>
              </div>

              <Badge variant="blue" size="sm">
                CITIZEN
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                icon={LogOut}
                onClick={handleLogout}
                style={{ color: '#94a3b8' }}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {!isLanding && (
                <Link to="/">
                  <Button variant="ghost" size="sm" icon={Home}>
                    Role Select
                  </Button>
                </Link>
              )}
              <Badge variant="green" size="sm" dot pulseDot>
                SAVIOUR Online
              </Badge>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

