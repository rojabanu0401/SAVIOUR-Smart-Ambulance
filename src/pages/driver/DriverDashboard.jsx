import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Siren,
  Navigation,
  User,
  Truck,
  History,
  DollarSign,
  Settings,
  LogOut,
  Check,
  X,
  Phone,
  Clock,
  Compass,
  AlertTriangle,
  Zap,
  Activity,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Power,
  Layers,
  MapPin,
  HeartPulse,
  Send,
  Sparkles,
  PhoneCall,
  CheckSquare,
  Lock,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEmergency } from '../../hooks/useEmergency';
import { soundService } from '../../utils/soundService';
import Toast from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const DriverDashboard = () => {
  const navigate = useNavigate();
  const { driver, updateDriverStatus, logoutDriver } = useAuth();
  const {
    incomingEmergencies,
    driverActiveEmergency,
    acceptRequest,
    rejectRequest,
    completeTrip,
    loading: emergencyLoading,
    error: emergencyError,
  } = useEmergency();

  // Active Tab in Sidebar
  const [activeNav, setActiveNav] = useState('dashboard');
  const [toggleLoading, setToggleLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const isOnline = driver?.isOnline ?? true;

  // Active or pending emergencies for this driver
  const pendingRequests = incomingEmergencies.filter((e) => (e.status || '').toUpperCase() === 'PENDING');
  const otherAcceptedRequests = incomingEmergencies.filter(
    (e) => (e.status || '').toUpperCase() === 'ACCEPTED' && e.acceptedDriver?.id !== driver?.id
  );

  // Is navigation active for the currently authenticated driver?
  const isNavigationActive = Boolean(
    driverActiveEmergency &&
    (driverActiveEmergency.status || '').toUpperCase() === 'ACCEPTED'
  );

  // Audio Alarm Lifecycle
  useEffect(() => {
    const hasPending = pendingRequests.length > 0;
    if (hasPending && isOnline && !driverActiveEmergency) {
      soundService.startEmergencyAlarm();
    } else {
      soundService.stopEmergencyAlarm();
    }

    return () => {
      soundService.stopEmergencyAlarm();
    };
  }, [pendingRequests.length, isOnline, driverActiveEmergency]);

  // Enable / Unlock Web Audio on first user interaction
  const handleUnlockAudio = () => {
    const success = soundService.unlockAudio();
    if (success) {
      setAudioUnlocked(true);
      if (pendingRequests.length > 0) {
        soundService.startEmergencyAlarm();
      }
    }
  };

  // Toggle duty online/offline
  const handleToggleOnline = async () => {
    setToggleLoading(true);
    soundService.unlockAudio();
    try {
      await updateDriverStatus(!isOnline);
      if (isOnline) {
        soundService.stopEmergencyAlarm();
      }
      setFeedbackToast({
        type: 'info',
        message: !isOnline ? 'You are now ONLINE and ready for dispatch.' : 'You are now OFFLINE on standby.',
      });
    } finally {
      setToggleLoading(false);
    }
  };

  // Accept emergency
  const handleAccept = async (emergencyId) => {
    soundService.stopEmergencyAlarm();
    soundService.unlockAudio();

    try {
      const result = await acceptRequest(emergencyId);
      if (result?.success) {
        soundService.stopEmergencyAlarm();
        console.log('[DISPATCH] Navigation opened');
        // Automatically navigate to the Driver Navigation page
        navigate('/driver/navigation', {
          state: {
            emergencyId: result.emergency?.id || emergencyId,
            emergencyRequestId: result.emergency?.id || emergencyId,
            emergency: result.emergency,
          },
        });
      } else if (result?.alreadyAccepted) {
        soundService.stopEmergencyAlarm();
        setFeedbackToast({
          type: 'warning',
          title: 'Request Already Claimed',
          message: result.error || 'This emergency has already been accepted by another driver.',
        });
      }
    } catch (err) {
      soundService.stopEmergencyAlarm();
      setFeedbackToast({
        type: 'error',
        message: err.message || 'Failed to accept emergency request.',
      });
    }
  };

  // Reject emergency
  const handleReject = async (emergencyId) => {
    soundService.stopEmergencyAlarm();
    soundService.unlockAudio();
    await rejectRequest(emergencyId);
    setFeedbackToast({
      type: 'info',
      message: `Emergency ${emergencyId} dismissed from queue.`,
    });
  };

  // Complete emergency
  const handleComplete = async (emergencyId) => {
    if (window.confirm('Confirm that patient transit is complete and return to ready status?')) {
      await completeTrip(emergencyId);
      setFeedbackToast({
        type: 'success',
        title: 'Emergency Completed',
        message: 'Patient transit safely completed. Driver status restored to Available.',
      });
    }
  };

  const handleLogout = async () => {
    soundService.stopEmergencyAlarm();
    await logoutDriver();
    navigate('/driver/login');
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        gap: '1.5rem',
        minHeight: 'calc(100vh - 100px)',
        width: '100%',
      }}
      onClick={handleUnlockAudio}
    >
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside
        style={{
          width: '250px',
          flexShrink: 0,
          backgroundColor: '#0B111E',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div>
          {/* Logo & Brand Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.5rem 0.5rem 1.5rem 0.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1rem',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.5)',
              }}
            >
              <Siren size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                SAVIOUR
              </h2>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
                Emergency Fleet
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              {
                id: 'requests',
                label: 'Emergency Requests',
                icon: Siren,
                badge: pendingRequests.length > 0 ? pendingRequests.length : undefined,
              },
              {
                id: 'navigation',
                label: 'Navigation',
                icon: Navigation,
                badge: isNavigationActive ? 'ACTIVE' : undefined,
                badgeColor: '#10b981',
              },
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'ambulance', label: 'Ambulance', icon: Truck },
              { id: 'history', label: 'History', icon: History },
              { id: 'earnings', label: 'Earnings', icon: DollarSign },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.id);
                    if (item.id === 'navigation') {
                      if (isNavigationActive) {
                        navigate('/driver/navigation', {
                          state: { emergencyId: driverActiveEmergency?.id },
                        });
                      } else {
                        setFeedbackToast({
                          type: 'info',
                          message: 'No active accepted emergency. Standby for dispatch.',
                        });
                      }
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: isActive ? '#2563eb' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} color={isActive ? '#ffffff' : '#94a3b8'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: item.badgeColor || '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      className={item.badgeColor ? 'pulse-green' : 'pulse-siren'}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Audio Siren Unlock Indicator & Logout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {!audioUnlocked && (
            <button
              type="button"
              onClick={handleUnlockAudio}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#38bdf8',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Volume2 size={14} />
              <span>Enable Siren Audio</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT (CLEAN FLEET COMMAND - ZERO UNACCEPTED MAP) */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
        {/* Top Bar: Driver Online/Offline Duty Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: '0.85rem 1.25rem',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={handleToggleOnline}
              disabled={toggleLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-full)',
                padding: '0.45rem 1rem',
                color: isOnline ? '#10b981' : '#94a3b8',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#10b981' : '#94a3b8',
                }}
                className={isOnline ? 'pulse-green' : ''}
              />
              <span>{isOnline ? 'Duty: ONLINE' : 'Duty: OFFLINE'}</span>
              <ChevronDown size={14} />
            </button>

            <span style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
              Unit: <strong style={{ color: '#f8fafc' }}>{driver?.ambulanceNumber || 'KA-01-EA-1088'}</strong>
              {' '}&bull;{' '}
              <strong style={{ color: '#38bdf8' }}>{driver?.fullName || 'Rahul Sharma'}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge variant="green" size="sm">
              <ShieldCheck size={12} style={{ marginRight: '4px' }} /> Verified ALS Unit
            </Badge>
            <Badge variant={isOnline ? 'blue' : 'yellow'} size="sm" dot>
              {isOnline ? 'GPS Telemetry Active' : 'Standby Mode'}
            </Badge>
          </div>
        </div>

        {/* Feedback Toast */}
        {feedbackToast && (
          <Toast
            type={feedbackToast.type}
            title={feedbackToast.title}
            message={feedbackToast.message}
            onClose={() => setFeedbackToast(null)}
          />
        )}

        {/* ========================================================================= */}
        {/* CASE 1: ACTIVE EMERGENCY (DRIVER HAS ACCEPTED) */}
        {/* ========================================================================= */}
        {isNavigationActive && driverActiveEmergency ? (
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #10b981',
              borderRadius: 'var(--radius-xl)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid #10b981',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="pulse-green"
                >
                  <Truck size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
                    🚑 ACTIVE EMERGENCY DISPATCH
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                    Request #{driverActiveEmergency.id} &bull; Status: EN ROUTE
                  </span>
                </div>
              </div>

              <Badge variant="green" size="md" dot pulseDot>
                NAVIGATION ACTIVE
              </Badge>
            </div>

            {/* Emergency Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                backgroundColor: 'rgba(11, 18, 32, 0.8)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Patient Name
                </span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f8fafc', margin: '3px 0 0' }}>
                  {driverActiveEmergency.requesterName || 'Citizen User'}
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                  📞 +91 {driverActiveEmergency.requesterPhone || '9876543210'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Pickup Address
                </span>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', margin: '3px 0 0', lineHeight: 1.3 }}>
                  {driverActiveEmergency.address || 'Emergency Point, Bengaluru'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Condition
                </span>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backgroundColor: 'rgba(239, 68, 68, 0.18)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {driverActiveEmergency.patientCondition || 'Critical'}
                  </span>
                </div>
              </div>
            </div>

            {/* Launch Live Navigation Action */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '0.75rem' }}>
              <Button
                variant="primary"
                size="lg"
                icon={Navigation}
                onClick={() => {
                  console.log('[DISPATCH] Navigation opened');
                  navigate('/driver/navigation', {
                    state: { emergencyId: driverActiveEmergency.id },
                  });
                }}
                style={{
                  fontWeight: 900,
                  fontSize: '1rem',
                  boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)',
                }}
              >
                🚀 OPEN LIVE NAVIGATION MAP
              </Button>

              <Button
                variant="outline"
                size="lg"
                icon={CheckSquare}
                onClick={() => handleComplete(driverActiveEmergency.id)}
                style={{ color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                Complete Trip
              </Button>
            </div>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* CASE 2: PENDING EMERGENCY REQUESTS AWAITING ACCEPTANCE */}
        {/* ========================================================================= */}
        {!isNavigationActive && pendingRequests.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  backgroundColor: '#0F172A',
                  border: '2px solid #ef4444',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  boxShadow: '0 0 30px rgba(239, 68, 68, 0.35)',
                  animation: 'fadeIn 0.25s ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 16px rgba(239, 68, 68, 0.8)',
                      }}
                      className="pulse-siren"
                    >
                      <Siren size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ef4444', margin: 0 }}>
                        🚨 EMERGENCY REQUEST DISPATCH
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        Request ID: {req.id}
                      </span>
                    </div>
                  </div>

                  <Badge variant="red" size="md" dot pulseDot>
                    INCOMING SOS
                  </Badge>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    backgroundColor: 'rgba(11, 18, 32, 0.8)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Patient Details
                    </span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: '2px 0 0' }}>
                      {req.requesterName || 'Citizen User'}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                      📞 +91 {req.requesterPhone || '9876543210'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Pickup Location
                    </span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', margin: '2px 0 0', lineHeight: 1.3 }}>
                      {req.address || 'Emergency Pickup Point, Bengaluru'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Condition & Time
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                        }}
                      >
                        {req.patientCondition || 'Critical'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(req.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                  <Button
                    variant="success"
                    size="lg"
                    icon={Check}
                    onClick={() => handleAccept(req.id)}
                    loading={emergencyLoading}
                    style={{
                      fontWeight: 900,
                      boxShadow: '0 0 16px rgba(16, 185, 129, 0.5)',
                    }}
                  >
                    ACCEPT & START NAVIGATION
                  </Button>

                  <Button
                    variant="emergency"
                    size="lg"
                    icon={X}
                    onClick={() => handleReject(req.id)}
                    style={{ fontWeight: 700 }}
                  >
                    REJECT
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* CASE 3: REQUEST CLAIMED BY ANOTHER DRIVER */}
        {/* ========================================================================= */}
        {!isNavigationActive && pendingRequests.length === 0 && otherAcceptedRequests.length > 0 ? (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.25rem',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '0.9rem',
                color: '#f87171',
                fontWeight: 800,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Lock size={16} /> Request #{otherAcceptedRequests[0].id} already accepted by another driver
            </p>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
              You remain online on duty. Ready for incoming dispatches.
            </span>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* CASE 4: FLEET DISPATCH STANDBY HERO (WHEN NO ACTIVE OR PENDING EMERGENCY) */}
        {/* ========================================================================= */}
        {!isNavigationActive && pendingRequests.length === 0 ? (
          <div
            style={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-xl)',
              padding: '3rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                border: '2px solid #38bdf8',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(56, 189, 248, 0.25)',
              }}
            >
              <Radio size={36} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 6px 0' }}>
                🚑 Fleet Dispatch Standby
              </h3>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981', margin: '0 0 4px 0' }}>
                Ready & Monitoring Emergency Dispatches
              </p>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Awaiting citizen SOS broadcasts in your coverage sector.
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                backgroundColor: 'rgba(11, 18, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.5rem',
                maxWidth: '560px',
                width: '100%',
                marginTop: '0.5rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Duty Status</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isOnline ? '#10b981' : '#f59e0b' }}>
                  {isOnline ? 'Active Online' : 'Standby Offline'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Unit Fleet</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                  {driver?.ambulanceNumber || 'KA-01-EA-1088'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Sector Radius</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  10 km Live
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Fleet & Vehicle Details Card */}
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}
            >
              🚑
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '0.95rem', color: '#f8fafc', fontFamily: 'monospace' }}>
                  {driver?.ambulanceNumber || 'KA-01-EA-1088'}
                </strong>
                <Badge variant="green" size="sm">
                  Verified Fleet Unit
                </Badge>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                {driver?.ambulanceType || 'Advanced Life Support (ALS)'} &bull; Base: {driver?.hospitalAffiliation || 'Central Emergency Trauma Base'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Driver Phone:</span>
            <strong style={{ fontSize: '0.82rem', color: '#38bdf8' }}>+91 {driver?.phone || '9876500001'}</strong>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
