import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  AlertCircle,
  ShieldCheck,
  Radio,
  LogOut,
  Navigation,
  Cross,
  PhoneCall,
  Clock,
  Compass,
  CheckCircle2,
  Phone,
  Truck,
  Sparkles,
  XCircle,
  HeartPulse,
  Share2,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEmergency } from '../../hooks/useEmergency';
import { locationService } from '../../services/locationService';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Toast from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ADDRESS_PRESETS = [
  { label: 'Indiranagar 100ft Rd', address: 'Indiranagar 100ft Rd, Bengaluru', lat: 12.9784, lng: 77.6408 },
  { label: 'Koramangala 4th Block', address: 'Koramangala 4th Block, Bengaluru', lat: 12.9352, lng: 77.6245 },
  { label: 'Anna Salai Mall', address: 'Anna Salai, Near Spencer Plaza Mall, Chennai', lat: 12.9716, lng: 77.5946 },
  { label: 'MG Road Central', address: 'MG Road Central Metro Station', lat: 12.9756, lng: 77.6066 },
];

export const CommonDashboard = () => {
  const navigate = useNavigate();
  const { commonUser, logoutCommon } = useAuth();
  const { userEmergency, triggerSOS, cancelSOS, loading: emergencyLoading, error: emergencyError } = useEmergency();

  const [address, setAddress] = useState(
    () => userEmergency?.address || 'Anna Salai, Near Spencer Plaza Mall, Chennai'
  );
  const [coords, setCoords] = useState(() => ({
    latitude: userEmergency?.latitude || 12.9716,
    longitude: userEmergency?.longitude || 77.5946,
    isLive: false,
  }));

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('GPS Coordinates Calibrated');
  const [feedbackError, setFeedbackError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Update coords if userEmergency already exists
  useEffect(() => {
    if (userEmergency) {
      if (userEmergency.address) setAddress(userEmergency.address);
      if (userEmergency.latitude && userEmergency.longitude) {
        setCoords({
          latitude: userEmergency.latitude,
          longitude: userEmergency.longitude,
          isLive: true,
        });
      }
    }
  }, [userEmergency]);

  // Geolocation Handler
  const handleDetectLocation = async () => {
    setIsLocating(true);
    setFeedbackError('');
    setLocationStatus('Acquiring high-accuracy GPS coordinates from device...');
    try {
      const pos = await locationService.getCurrentPosition();
      const lat = Number(pos.latitude.toFixed(5));
      const lng = Number(pos.longitude.toFixed(5));
      setCoords({
        latitude: lat,
        longitude: lng,
        isLive: true,
      });
      setLocationStatus(`Live GPS Fixed (Lat: ${lat}, Lng: ${lng})`);
      setAddress(`GPS Location (${lat}, ${lng}), Emergency Point`);
      setSuccessToast('GPS location successfully acquired!');
    } catch (err) {
      setFeedbackError(`Geolocation notice: ${err.message}. Using manual address coordinates.`);
      setLocationStatus('Using calibrated city location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setAddress(preset.address);
    setCoords({
      latitude: preset.lat,
      longitude: preset.lng,
      isLive: false,
    });
    setLocationStatus(`Preset selected: ${preset.label}`);
  };

  // SOS Trigger Handler with Debounce Protection
  const handleTriggerSOS = async () => {
    if (isSubmitting || emergencyLoading || isSearching || isAccepted) return;

    console.log('[SOS] button clicked');
    console.log('[SOS] authenticated user ID:', commonUser?.id);
    setFeedbackError('');
    if (!address.trim()) {
      setFeedbackError('Please provide a valid emergency pickup address or use GPS location.');
      return;
    }

    setIsSubmitting(true);
    try {
      await triggerSOS({
        address: address.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      setSuccessToast('🚨 Emergency request dispatched to nearest SAVIOUR ambulances!');
    } catch (err) {
      setFeedbackError(err.message || 'Failed to dispatch SOS alert. Please try again.');
    } finally {
      setTimeout(() => setIsSubmitting(false), 800);
    }
  };

  // Cancel SOS Handler
  const handleCancelSOS = async () => {
    if (window.confirm('Are you sure you want to cancel this emergency ambulance request?')) {
      await cancelSOS();
      setSuccessToast('Emergency request cancelled.');
    }
  };

  const handleLogout = () => {
    logoutCommon();
    navigate('/common/login');
  };

  const isSearching = (userEmergency?.status || '').toUpperCase() === 'PENDING';
  const isAccepted = (userEmergency?.status || '').toUpperCase() === 'ACCEPTED';
  const acceptedDriver = userEmergency?.acceptedDriver;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner with Citizen Profile & SAVIOUR Status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          backgroundColor: '#0F172A',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(37, 99, 235, 0.18)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.3)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
            }}
          >
            {commonUser?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                {commonUser?.name || 'Citizen User'}
              </h2>
              <Badge variant="blue" size="sm">
                SAVIOUR Citizen
              </Badge>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '2px' }}>
              Registered Mobile: <strong style={{ color: '#f8fafc' }}>+91 {commonUser?.phone || '9876543210'}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Badge
            variant={isAccepted ? 'green' : isSearching ? 'red' : 'green'}
            size="md"
            dot
            pulseDot={isSearching || isAccepted}
          >
            {isAccepted ? 'Ambulance En Route' : isSearching ? 'Searching Drivers...' : 'SAVIOUR Ready'}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            icon={LogOut}
            onClick={handleLogout}
            style={{ color: '#94a3b8' }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Alerts / Feedback */}
      {(feedbackError || emergencyError) && (
        <Toast
          type="error"
          message={feedbackError || emergencyError}
          onClose={() => setFeedbackError('')}
        />
      )}

      {successToast && (
        <Toast
          type="success"
          message={successToast}
          onClose={() => setSuccessToast('')}
        />
      )}

      {/* DYNAMIC DISPATCH STATUS AREA */}
      {isAccepted && acceptedDriver ? (
        /* 1. ACCEPTED STATE CARD: FOCUSED DRIVER DETAILS & EN ROUTE STATUS */
        <Card
          variant="emergency"
          title="🚑 AMBULANCE DRIVER ACCEPTED"
          subtitle={`${acceptedDriver.name} has accepted your emergency request.`}
          icon={Truck}
          badge={
            <Badge variant="green" size="md" dot pulseDot>
              STATUS: EN ROUTE (~{acceptedDriver.etaMin || 4} MINS)
            </Badge>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                  Assigned Driver
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#f8fafc', margin: '4px 0 2px' }}>
                  {acceptedDriver.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', margin: 0 }}>
                  Hospital Base: <strong style={{ color: '#f8fafc' }}>{acceptedDriver.hospitalAffiliation || 'Central Emergency Trauma Base'}</strong>
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                  Ambulance Registration
                </span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'monospace', margin: '4px 0 2px' }}>
                  {acceptedDriver.ambulanceNumber}
                </h4>
                <Badge variant="blue" size="sm">
                  {acceptedDriver.ambulanceType || 'Advanced Life Support (ALS)'}
                </Badge>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                  Dispatch Status
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 2px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                    }}
                    className="pulse-green"
                  />
                  <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>EN ROUTE</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', margin: 0 }}>
                  Est. Arrival: <strong style={{ color: '#f8fafc' }}>~{acceptedDriver.etaMin || 4} Mins</strong>
                </p>
              </div>
            </div>

            {/* Quick Actions for Common User */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a href={`tel:${acceptedDriver.phone}`} style={{ textDecoration: 'none' }}>
                  <Button variant="emergency" size="md" icon={PhoneCall}>
                    Call Driver (+91 {acceptedDriver.phone})
                  </Button>
                </a>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={XCircle}
                onClick={handleCancelSOS}
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              >
                Cancel Emergency Request
              </Button>
            </div>
          </div>
        </Card>
      ) : isSearching ? (
        /* 2. SEARCHING / BROADCASTING SOS STATE */
        <Card
          variant="emergency"
          title="DISPATCHING EMERGENCY REQUEST"
          subtitle="Searching for an available ambulance..."
          icon={Radio}
          badge={
            <Badge variant="red" size="md" dot pulseDot>
              BROADCASTING SOS
            </Badge>
          }
        >
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px dashed rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.8)',
              }}
              className="pulse-siren"
            >
              <Radio size={32} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
                Searching for an available ambulance...
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)', maxWidth: '440px', margin: '6px auto 0' }}>
                Your emergency request <strong style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{userEmergency?.id}</strong> has been transmitted to verified on-duty ambulances within a 10km radius.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: '#0B1220',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#f87171',
              }}
            >
              <LoadingSpinner size={16} color="#ef4444" />
              <span>Awaiting Driver Acceptance (Multi-Device Sync Active)</span>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <Button
                variant="outline"
                size="sm"
                icon={XCircle}
                onClick={handleCancelSOS}
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.5)' }}
              >
                Cancel Emergency Request
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Main Grid: Location Configuration & SOS Trigger */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Card 1: Emergency SOS Dispatch Trigger */}
        <Card
          variant="emergency"
          title="Emergency Ambulance Dispatch"
          subtitle="Instant 1-tap SOS trigger with automated driver dispatch"
          icon={HeartPulse}
          badge={<Badge variant="red" size="sm">SAVIOUR 1-Tap SOS</Badge>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                backgroundColor: 'rgba(11, 18, 32, 0.7)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.75rem 1.25rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              {/* Big Red Glowing SOS Button */}
              <button
                type="button"
                onClick={handleTriggerSOS}
                disabled={isSearching || isAccepted || emergencyLoading || isSubmitting}
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  backgroundColor: isSearching || isAccepted ? '#334155' : '#ef4444',
                  color: '#ffffff',
                  border: '5px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: isSearching || isAccepted
                    ? 'none'
                    : '0 0 35px rgba(239, 68, 68, 0.7), 0 0 60px rgba(239, 68, 68, 0.3)',
                  cursor: isSearching || isAccepted || isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className={!isSearching && !isAccepted ? 'pulse-emergency' : ''}
              >
                {emergencyLoading || isSubmitting ? (
                  <LoadingSpinner size={32} color="#ffffff" />
                ) : (
                  <>
                    <Cross size={28} />
                    <span>SOS</span>
                  </>
                )}
              </button>

              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  {isAccepted
                    ? 'Ambulance Assigned & En Route'
                    : isSearching
                    ? 'Emergency SOS Active'
                    : 'TRIGGER EMERGENCY SOS'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', marginTop: '4px', maxWidth: '300px' }}>
                  {isAccepted
                    ? 'Assigned ambulance is traveling to your pickup point.'
                    : isSearching
                    ? 'Waiting for driver acceptance on the network.'
                    : 'Clicking SOS will instantly alert nearest available ambulances with your GPS location.'}
                </p>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                style={{
                  backgroundColor: 'rgba(11, 18, 32, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  textAlign: 'left',
                }}
              >
                <p style={{ fontSize: '0.72rem', color: 'var(--slate-400)', margin: 0 }}>National Emergency</p>
                <p style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ef4444', margin: '2px 0 0' }}>
                  108 / 112
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(11, 18, 32, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  textAlign: 'left',
                }}
              >
                <p style={{ fontSize: '0.72rem', color: 'var(--slate-400)', margin: 0 }}>City Trauma Control</p>
                <p style={{ fontWeight: 800, fontSize: '1.05rem', color: '#38bdf8', margin: '2px 0 0' }}>
                  080-2222-1080
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: GPS Location & Address Selection */}
        <Card
          variant="default"
          title="Emergency Pickup Location"
          subtitle="Configure your exact GPS coordinates or landmark address"
          icon={MapPin}
          badge={
            <Badge variant={coords.isLive ? 'green' : 'gray'} size="sm" dot pulseDot={coords.isLive}>
              {coords.isLive ? 'Live GPS Locked' : 'Address Preset'}
            </Badge>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Address Input */}
            <Input
              id="pickup-address"
              label="Pickup Address / Landmark"
              placeholder="Enter building, street, or landmark"
              icon={MapPin}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSearching || isAccepted}
              helperText="This address is transmitted directly to ambulance navigation"
            />

            {/* Quick Presets */}
            <div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--slate-400)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '0.5rem',
                }}
              >
                <Sparkles size={13} color="#38bdf8" />
                Quick Location Presets
              </span>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {ADDRESS_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    disabled={isSearching || isAccepted}
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: address === preset.address ? 'rgba(37, 99, 235, 0.25)' : 'rgba(11, 18, 32, 0.7)',
                      border: address === preset.address ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: address === preset.address ? '#38bdf8' : 'var(--slate-300)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: isSearching || isAccepted ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinates Display */}
            <div
              style={{
                backgroundColor: 'rgba(11, 18, 32, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ backgroundColor: '#0B1220', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--slate-400)' }}>LATITUDE</span>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    {coords.latitude}&deg; N
                  </p>
                </div>
                <div style={{ backgroundColor: '#0B1220', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--slate-400)' }}>LONGITUDE</span>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    {coords.longitude}&deg; E
                  </p>
                </div>
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} color="#10b981" />
                {locationStatus}
              </span>
            </div>

            {/* Geolocation Button */}
            <Button
              variant="outline"
              size="md"
              fullWidth
              icon={Navigation}
              onClick={handleDetectLocation}
              loading={isLocating}
              disabled={isSearching || isAccepted}
            >
              Detect Device GPS Location
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CommonDashboard;
