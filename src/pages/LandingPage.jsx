import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Truck, Siren, ShieldCheck, Zap, Radio, MapPin, ArrowRight, HeartPulse } from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Hero Section */}
      <div
        style={{
          textAlign: 'center',
          padding: '2.5rem 1rem 1rem',
          maxWidth: '850px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <Badge variant="red" size="md" dot pulseDot>
            SAVIOUR Emergency Response & Traffic Preemption Network
          </Badge>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            color: '#ffffff',
            marginBottom: '1.25rem',
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
          }}
        >
          SAVIOUR <span style={{ color: '#ef4444' }}>Emergency Dispatch</span>
        </h1>

        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--slate-300)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto 1.75rem',
          }}
        >
          Instant 1-tap SOS ambulance matching with live GPS tracking, real-time driver dispatch alerts, and automated green light preemption for critical patient transit.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--slate-400)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Radio size={16} color="#10b981" />
            Real-time GPS Tracking
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Zap size={16} color="#f59e0b" />
            Green Signal Preemption
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={16} color="#38bdf8" />
            100% Verified Fleet
          </span>
        </div>
      </div>

      {/* Role Selection Cards */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
            Select Your Role to Enter SAVIOUR
          </h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem' }}>
            Choose whether you are a citizen requesting emergency assistance or an authorized ambulance driver
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
            maxWidth: '900px',
            margin: '0 auto',
          }}
        >
          {/* Role 1: Common User */}
          <div
            onClick={() => navigate('/common/login')}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px solid rgba(56, 189, 248, 0.3)',
              padding: '2rem 1.75rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'left',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#38bdf8';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(56, 189, 248, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)';
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(37, 99, 235, 0.18)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                  }}
                >
                  <User size={28} />
                </div>
                <Badge variant="blue" size="sm">
                  Citizen SOS
                </Badge>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Common User / Patient
              </h3>

              <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Trigger immediate emergency SOS dispatch, share GPS location, and track assigned ambulance arrival in real time.
              </p>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="md"
              iconRight={ArrowRight}
              onClick={() => navigate('/common/login')}
            >
              Enter as Common User
            </Button>
          </div>

          {/* Role 2: Ambulance Driver */}
          <div
            onClick={() => navigate('/driver/login')}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: 'var(--radius-xl)',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              padding: '2rem 1.75rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'left',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)';
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <Truck size={28} />
                </div>
                <Badge variant="red" size="sm">
                  SAVIOUR Fleet
                </Badge>
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Ambulance Driver
              </h3>

              <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Receive live emergency dispatches, accept patient calls, navigate with interactive OSM route maps, and request green signal overrides.
              </p>
            </div>

            <Button
              variant="emergency"
              fullWidth
              size="md"
              iconRight={ArrowRight}
              onClick={() => navigate('/driver/login')}
            >
              Enter as Ambulance Driver
            </Button>
          </div>
        </div>
      </div>

      {/* Network Overview / Trust Banner */}
      <Card
        variant="subtle"
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ color: '#38bdf8', marginBottom: '0.5rem' }}>
              <Siren size={26} style={{ margin: '0 auto' }} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>100% Verified Fleet</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
              All ambulances authenticated with transport registration
            </p>
          </div>

          <div>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>
              <Zap size={26} style={{ margin: '0 auto' }} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>Signal Preemption</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
              Automated green light override on emergency transit routes
            </p>
          </div>

          <div>
            <div style={{ color: '#ef4444', marginBottom: '0.5rem' }}>
              <MapPin size={26} style={{ margin: '0 auto' }} />
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>Fastest Hospital Route</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>
              Dynamic GPS routing to closest specialized trauma center
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LandingPage;

