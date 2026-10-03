import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  Siren,
  Zap,
  CheckCircle2,
  Volume2,
  VolumeX,
  Radio,
  Check,
  Hospital,
  Route,
  Play,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useEmergency } from '../../hooks/useEmergency';
import { useNavigationSimulation } from '../../hooks/useNavigationSimulation';
import { soundService } from '../../utils/soundService';
import MapView from '../../components/map/MapView';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';

export const DriverNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { driver } = useAuth();
  const {
    driverActiveEmergency,
    incomingEmergencies = [],
    completeTrip,
  } = useEmergency();

  const [feedbackToast, setFeedbackToast] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Determine active emergency from router state or hooks
  const emergencyIdFromState = location.state?.emergencyId || location.state?.emergencyRequestId;
  const emergencyFromState = location.state?.emergency;
  const emergenciesList = Array.isArray(incomingEmergencies) ? incomingEmergencies : [];

  const activeEmergency =
    driverActiveEmergency ||
    (emergencyFromState && (emergencyFromState.status || '').toUpperCase() === 'ACCEPTED'
      ? emergencyFromState
      : null) ||
    (emergencyIdFromState
      ? emergenciesList.find((e) => e.id === emergencyIdFromState)
      : null) ||
    emergenciesList.find(
      (e) =>
        (e.status || '').toUpperCase() === 'ACCEPTED' &&
        (e.acceptedDriver?.id === driver?.id || e.assigned_driver_id === driver?.id)
    ) ||
    null;

  // Single reliable condition: only active if status is ACCEPTED and assigned to this driver
  const isNavigationActive = Boolean(
    activeEmergency &&
    (activeEmergency.status || '').toUpperCase() === 'ACCEPTED' &&
    (!activeEmergency.assigned_driver_id ||
      activeEmergency.assigned_driver_id === driver?.id ||
      activeEmergency.acceptedDriver?.id === driver?.id ||
      driverActiveEmergency?.id === activeEmergency.id)
  );

  // Base GPS coordinates for driver
  const baseDriverCoords = {
    latitude: driver?.phone === '9876500001' ? 12.9784 : 12.9352,
    longitude: driver?.phone === '9876500001' ? 77.6408 : 77.6245,
    name: driver?.fullName || 'Ambulance Driver',
  };

  // Destination / Emergency Pickup GPS coordinates
  const pickupCoords = isNavigationActive
    ? {
        latitude: Number(activeEmergency?.latitude) || 12.9716,
        longitude: Number(activeEmergency?.longitude) || 77.5946,
        name: activeEmergency?.requesterName || 'Emergency Patient',
        address: activeEmergency?.address || 'Anna Salai, Near Spencer Plaza Mall, Chennai',
      }
    : baseDriverCoords;

  // Initialize Navigation Simulation Hook (Phase 5 State Machine)
  const sim = useNavigationSimulation({
    startCoords: baseDriverCoords,
    pickupCoords: pickupCoords,
  });

  // Stop emergency siren upon entering navigation
  useEffect(() => {
    try {
      soundService.stopEmergencyAlarm();
    } catch {}
  }, []);

  // Handle Complete Emergency Trip
  const handleCompleteTrip = async () => {
    setIsCompleting(true);
    try {
      if (activeEmergency?.id) {
        await completeTrip(activeEmergency.id);
      }
      setFeedbackToast({
        type: 'success',
        title: 'Emergency Mission Completed',
        message: 'Patient transit safely completed. Returning to Fleet Standby.',
      });
      setTimeout(() => {
        navigate('/driver/dashboard');
      }, 1500);
    } catch (err) {
      setFeedbackToast({
        type: 'error',
        message: err.message || 'Failed to complete trip.',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // Toggle Audio Mute
  const handleToggleAudio = () => {
    if (!isAudioMuted) {
      try { soundService.stopEmergencyAlarm(); } catch {}
      setIsAudioMuted(true);
    } else {
      try { soundService.unlockAudio(); } catch {}
      setIsAudioMuted(false);
    }
  };

  // Format Elapsed Time
  const formatTime = (secs) => {
    const s = Number(secs) || 0;
    const mins = Math.floor(s / 60);
    const remainder = s % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  // Memoized Ambulance Double-Click Handler
  const handleAmbulanceDblClick = useCallback(() => {
    sim.setFollowAmbulance(true);
  }, [sim.setFollowAmbulance]);

  // =========================================================================
  // IF NO ACTIVE ACCEPTED EMERGENCY -> RENDER FLEET DISPATCH STANDBY (NO MAP)
  // =========================================================================
  if (!isNavigationActive) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          height: '100vh',
          backgroundColor: '#080C14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '3rem 2.5rem',
            maxWidth: '520px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '2px solid #38bdf8',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(56, 189, 248, 0.3)',
            }}
          >
            <Radio size={36} />
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 6px 0' }}>
              🚑 Fleet Dispatch Standby
            </h2>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981', margin: '0 0 6px 0' }}>
              Ready & Monitoring Emergency Dispatches
            </p>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              No active emergency navigation session. The live navigation map, routes, and traffic signal priority become active immediately after accepting an emergency SOS broadcast.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={ArrowLeft}
            onClick={() => navigate('/driver/dashboard')}
            style={{ width: '100%', fontWeight: 800 }}
          >
            Return to Driver Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ACTIVE EMERGENCY NAVIGATION (GOOGLE MAPS-STYLE PROFESSIONAL NAVIGATION)
  // =========================================================================
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: '100vh',
        backgroundColor: '#080C14',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 1. TOP NAVIGATION COMMAND BAR */}
      <header
        style={{
          height: '56px',
          backgroundColor: 'rgba(11, 18, 32, 0.96)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}
      >
        {/* Left: Brand & Return */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            type="button"
            onClick={() => navigate('/driver/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Return to Driver Dashboard"
          >
            <ArrowLeft size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                backgroundColor: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 10px rgba(220, 38, 38, 0.6)',
              }}
            >
              <Siren size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.04em' }}>
                  SAVIOUR
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  LIVE NAV
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                Unit {driver?.ambulanceNumber || 'KA-01-EA-1088'} &bull; {driver?.fullName || 'Rahul Sharma'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Mission Status & Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {sim.workflowStep === 'LEG1_ROUTE_SELECTION' && (
            <Badge variant="blue" size="md" dot>
              🛣️ SELECT ROUTE TO PATIENT
            </Badge>
          )}
          {sim.workflowStep === 'TO_PATIENT' && (
            <Badge variant={sim.activeAlert ? 'red' : 'blue'} size="md" dot pulseDot>
              {sim.activeAlert ? '🚨 PRIORITY REQUEST SENT' : '🚑 TO PATIENT (40 km/h)'}
            </Badge>
          )}
          {sim.workflowStep === 'HOSPITAL_SELECTION' && (
            <Badge variant="yellow" size="md" dot>
              📍 PATIENT REACHED &bull; SELECT HOSPITAL
            </Badge>
          )}
          {sim.workflowStep === 'LEG2_ROUTE_SELECTION' && (
            <Badge variant="blue" size="md" dot>
              🛣️ SELECT ROUTE TO HOSPITAL
            </Badge>
          )}
          {sim.workflowStep === 'TO_HOSPITAL' && (
            <Badge variant={sim.activeAlert ? 'red' : 'green'} size="md" dot pulseDot>
              {sim.activeAlert ? '🚨 PRIORITY CORRIDOR ACTIVE' : '🚑 TO HOSPITAL (40 km/h)'}
            </Badge>
          )}
          {sim.workflowStep === 'HOSPITAL_REACHED' && (
            <Badge variant="green" size="md" dot pulseDot>
              🏥 ARRIVED AT HOSPITAL
            </Badge>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              padding: '0.3rem 0.75rem',
            }}
          >
            <Zap size={13} color="#38bdf8" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc' }}>
              40 km/h
            </span>
          </div>
        </div>

        {/* Right: Audio Toggle & Complete Trip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={handleToggleAudio}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: isAudioMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: isAudioMuted ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isAudioMuted ? '#f87171' : '#94a3b8',
              cursor: 'pointer',
            }}
            title={isAudioMuted ? 'Audio Alerts Muted' : 'Audio Alerts Enabled'}
          >
            {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <Button
            variant="danger"
            size="sm"
            icon={CheckSquare}
            onClick={handleCompleteTrip}
            loading={isCompleting}
            style={{ fontSize: '0.75rem', fontWeight: 800 }}
          >
            Complete Trip
          </Button>
        </div>
      </header>

      {/* 2. FULL-SCREEN HERO MAP (80-90% SCREEN VIEWPORT) */}
      <div style={{ position: 'relative', flex: 1, width: '100%', height: 'calc(100vh - 56px)', minHeight: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        <MapView
          driverCoords={sim.currentPosition}
          pickupCoords={pickupCoords}
          hospitals={sim.hospitals}
          selectedHospital={sim.selectedHospital}
          showHospitals={sim.workflowStep === 'HOSPITAL_SELECTION'}
          onSelectHospital={sim.selectHospital}
          route={sim.activeRoute}
          dualRoutes={sim.currentDualRoutes}
          selectedRouteType={sim.selectedRouteType}
          onSelectRouteType={sim.selectRouteType}
          externalTrafficLights={sim.trafficSignals}
          distanceKm={sim.activeRoute?.distanceKm || 3.8}
          etaMin={sim.activeRoute?.etaMin || 6}
          driverName={driver?.fullName || 'Rahul Sharma'}
          ambulanceNumber={driver?.ambulanceNumber || 'KA-01-EA-1088'}
          pickupAddress={pickupCoords.address}
          followAmbulance={sim.followAmbulance}
          onToggleFollow={sim.setFollowAmbulance}
          onAmbulanceDblClick={handleAmbulanceDblClick}
        />

        {/* 3. STEP 1: LEG 1 ROUTE SELECTION PANEL */}
        {sim.workflowStep === 'LEG1_ROUTE_SELECTION' && sim.currentDualRoutes && (
          <div
            className="animate-slide-up"
            style={{
              position: 'absolute',
              bottom: '1.25rem',
              left: '1.25rem',
              width: '280px',
              maxWidth: '90vw',
              backgroundColor: 'rgba(11, 18, 32, 0.96)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '12px',
              padding: '0.85rem',
              boxShadow: '0 12px 30px rgba(0,0,0,0.8), 0 0 16px rgba(56, 189, 248, 0.15)',
              backdropFilter: 'blur(16px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Route size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  CHOOSE BEST ROUTE
                </span>
              </div>
              <Badge variant="blue" size="sm">
                TO PATIENT
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {/* Recommended Route */}
              {sim.currentDualRoutes.recommended && (
                <div
                  onClick={() => sim.selectRouteType('recommended')}
                  style={{
                    padding: '0.6rem 0.75rem',
                    backgroundColor:
                      sim.selectedRouteType === 'recommended'
                        ? 'rgba(37, 99, 235, 0.2)'
                        : 'rgba(15, 23, 42, 0.7)',
                    border:
                      sim.selectedRouteType === 'recommended'
                        ? '2px solid #2563eb'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      sim.selectedRouteType === 'recommended'
                        ? '0 0 12px rgba(37, 99, 235, 0.4)'
                        : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#38bdf8' }}>
                      🔵 Recommended
                    </span>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        border: '1px solid #10b981',
                        padding: '1px 4px',
                        borderRadius: '3px',
                      }}
                    >
                      LOW TRAFFIC
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '2px' }}>
                    Easy + Low Traffic
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                    {sim.currentDualRoutes.recommended.distanceKm} km &bull; ~{sim.currentDualRoutes.recommended.etaMin} min
                  </div>
                </div>
              )}

              {/* Alternative Route */}
              {sim.currentDualRoutes.alternative && (
                <div
                  onClick={() => sim.selectRouteType('alternative')}
                  style={{
                    padding: '0.6rem 0.75rem',
                    backgroundColor:
                      sim.selectedRouteType === 'alternative'
                        ? 'rgba(37, 99, 235, 0.2)'
                        : 'rgba(15, 23, 42, 0.7)',
                    border:
                      sim.selectedRouteType === 'alternative'
                        ? '2px solid #2563eb'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      sim.selectedRouteType === 'alternative'
                        ? '0 0 12px rgba(37, 99, 235, 0.4)'
                        : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8' }}>
                      ⚪ Alternative
                    </span>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        padding: '1px 4px',
                        borderRadius: '3px',
                      }}
                    >
                      HEAVY TRAFFIC
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                    Shortest Route
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', marginTop: '4px' }}>
                    {sim.currentDualRoutes.alternative.distanceKm} km &bull; ~{sim.currentDualRoutes.alternative.etaMin} min
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 0',
              }}
            >
              <span>✓</span>
              <span>
                {sim.selectedRouteType === 'recommended'
                  ? 'Recommended route selected'
                  : 'Alternative route selected'}
              </span>
            </div>

            <button
              type="button"
              onClick={sim.startNavigation}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 900,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 0 16px rgba(37, 99, 235, 0.6)',
                transition: 'all 0.15s ease',
              }}
            >
              <Play size={14} fill="#ffffff" />
              <span>START NAVIGATION</span>
            </button>
          </div>
        )}

        {/* 4. ACTIVE NAVIGATION HUD */}
        {(sim.workflowStep === 'TO_PATIENT' || sim.workflowStep === 'TO_HOSPITAL') && (
          <div
            style={{
              position: 'absolute',
              bottom: '1.25rem',
              left: '1.25rem',
              width: '260px',
              maxWidth: '90vw',
              backgroundColor: 'rgba(11, 18, 32, 0.94)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              padding: '0.75rem 0.85rem',
              boxShadow: '0 10px 24px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(16px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Siren size={14} color="#ef4444" />
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  {sim.workflowStep === 'TO_PATIENT' ? '🚑 TO PATIENT' : '🚑 TO HOSPITAL'}
                </span>
              </div>
              <Badge
                variant={sim.activeAlert ? 'red' : 'blue'}
                size="sm"
              >
                40 km/h
              </Badge>
            </div>

            <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>
              {sim.workflowStep === 'TO_PATIENT'
                ? `📍 Dest: ${pickupCoords.name || 'Patient Pickup'}`
                : `🏥 Dest: ${sim.selectedHospital?.name || 'Hospital'}`}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.4rem',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                padding: '0.4rem 0.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Distance</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8' }}>
                  {((sim.remainingDistanceMeters * 1.22) / 1000).toFixed(1)} km
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>ETA</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>
                  ~{sim.totalETAMinutes} min
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Next Traffic Signal
                </span>
                {sim.nextSignal && (
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      color: sim.nextSignal.isPreempted ? '#10b981' : '#f59e0b',
                    }}
                  >
                    {sim.nextSignal.isPreempted ? '● PRIORITY GREEN' : '● MONITORING'}
                  </span>
                )}
              </div>

              {sim.nextSignal ? (
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.55rem',
                  }}
                >
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🚦 {sim.nextSignal.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '0.66rem' }}>
                    <span style={{ color: '#cbd5e1' }}>
                      Distance: <strong style={{ color: '#38bdf8' }}>{sim.nextSignalDistanceMeters} m</strong>
                    </span>
                    <span style={{ color: '#cbd5e1' }}>
                      ETA: <strong style={{ color: '#10b981' }}>{sim.nextSignalETASeconds} sec</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.55rem',
                    fontSize: '0.68rem',
                    color: '#10b981',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  ✓ Corridor signals cleared
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. STEP 2: HOSPITAL SELECTION PANEL */}
        {sim.workflowStep === 'HOSPITAL_SELECTION' && (
          <div
            className="animate-slide-up"
            style={{
              position: 'absolute',
              bottom: '1.25rem',
              left: '1.25rem',
              width: '280px',
              maxWidth: '90vw',
              backgroundColor: 'rgba(11, 18, 32, 0.96)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '12px',
              padding: '0.85rem',
              boxShadow: '0 12px 30px rgba(0,0,0,0.8), 0 0 16px rgba(56, 189, 248, 0.15)',
              backdropFilter: 'blur(16px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Hospital size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  SELECT HOSPITAL
                </span>
              </div>
              <Badge variant="blue" size="sm">
                4 NEARBY
              </Badge>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '0.4rem 0.55rem',
                fontSize: '0.68rem',
                color: '#10b981',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>📍</span>
              <span>PATIENT REACHED &bull; Pickup location reached.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '220px', overflowY: 'auto' }}>
              {Array.isArray(sim.hospitals) && sim.hospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  onClick={() => sim.selectHospital(hosp)}
                  style={{
                    padding: '0.5rem 0.65rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      🏥 {hosp.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 700, marginTop: '1px' }}>
                      {hosp.distanceKm} km &bull; ~{hosp.etaMin} min
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {hosp.capability}
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{
                      padding: '0.3rem 0.55rem',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      backgroundColor: '#38bdf8',
                      color: '#0b1220',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    SELECT
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. STEP 3: LEG 2 HOSPITAL ROUTE SELECTION */}
        {sim.workflowStep === 'LEG2_ROUTE_SELECTION' && sim.currentDualRoutes && sim.selectedHospital && (
          <div
            className="animate-slide-up"
            style={{
              position: 'absolute',
              bottom: '1.25rem',
              left: '1.25rem',
              width: '280px',
              maxWidth: '90vw',
              backgroundColor: 'rgba(11, 18, 32, 0.96)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '12px',
              padding: '0.85rem',
              boxShadow: '0 12px 30px rgba(0,0,0,0.8), 0 0 16px rgba(56, 189, 248, 0.15)',
              backdropFilter: 'blur(16px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Hospital size={15} color="#38bdf8" />
                <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  CHOOSE HOSPITAL ROUTE
                </span>
              </div>
              <Badge variant="blue" size="sm">
                TO HOSPITAL
              </Badge>
            </div>

            <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>
              🏥 Dest: {sim.selectedHospital.name}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {/* Recommended Route */}
              {sim.currentDualRoutes.recommended && (
                <div
                  onClick={() => sim.selectRouteType('recommended')}
                  style={{
                    padding: '0.6rem 0.75rem',
                    backgroundColor:
                      sim.selectedRouteType === 'recommended'
                        ? 'rgba(37, 99, 235, 0.2)'
                        : 'rgba(15, 23, 42, 0.7)',
                    border:
                      sim.selectedRouteType === 'recommended'
                        ? '2px solid #2563eb'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      sim.selectedRouteType === 'recommended'
                        ? '0 0 12px rgba(37, 99, 235, 0.4)'
                        : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#38bdf8' }}>
                      🔵 Recommended
                    </span>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        border: '1px solid #10b981',
                        padding: '1px 4px',
                        borderRadius: '3px',
                      }}
                    >
                      LOW TRAFFIC
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '2px' }}>
                    Easy + Low Traffic
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                    {sim.currentDualRoutes.recommended.distanceKm} km &bull; ~{sim.currentDualRoutes.recommended.etaMin} min
                  </div>
                </div>
              )}

              {/* Alternative Route */}
              {sim.currentDualRoutes.alternative && (
                <div
                  onClick={() => sim.selectRouteType('alternative')}
                  style={{
                    padding: '0.6rem 0.75rem',
                    backgroundColor:
                      sim.selectedRouteType === 'alternative'
                        ? 'rgba(37, 99, 235, 0.2)'
                        : 'rgba(15, 23, 42, 0.7)',
                    border:
                      sim.selectedRouteType === 'alternative'
                        ? '2px solid #2563eb'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      sim.selectedRouteType === 'alternative'
                        ? '0 0 12px rgba(37, 99, 235, 0.4)'
                        : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8' }}>
                      ⚪ Alternative
                    </span>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        padding: '1px 4px',
                        borderRadius: '3px',
                      }}
                    >
                      HEAVY TRAFFIC
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                    Shortest Route
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#cbd5e1', marginTop: '4px' }}>
                    {sim.currentDualRoutes.alternative.distanceKm} km &bull; ~{sim.currentDualRoutes.alternative.etaMin} min
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 0',
              }}
            >
              <span>✓</span>
              <span>
                {sim.selectedRouteType === 'recommended'
                  ? 'Recommended route selected'
                  : 'Alternative route selected'}
              </span>
            </div>

            <button
              type="button"
              onClick={sim.startNavigation}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 900,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 0 16px rgba(37, 99, 235, 0.6)',
                transition: 'all 0.15s ease',
              }}
            >
              <Play size={14} fill="#ffffff" />
              <span>START NAVIGATION</span>
            </button>
          </div>
        )}

        {/* 7. SMALL FLOATING 30-SECOND TRAFFIC PRIORITY ALERT */}
        {sim.activeAlert && (
          <div
            className="animate-slide-down"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '4.5rem',
              width: '240px',
              maxWidth: '85vw',
              backgroundColor: 'rgba(11, 18, 32, 0.96)',
              border: '1.5px solid #10b981',
              borderRadius: '10px',
              padding: '0.6rem 0.75rem',
              boxShadow: '0 10px 24px rgba(0,0,0,0.7), 0 0 16px rgba(16, 185, 129, 0.3)',
              backdropFilter: 'blur(16px)',
              zIndex: 1000,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#10b981', letterSpacing: '0.03em' }}>
                🚦 SIGNAL AHEAD
              </span>
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid #10b981',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                🟢 PRIORITY REQUEST SENT
              </span>
            </div>

            <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sim.activeAlert.name}
            </h4>

            <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
              <strong style={{ color: '#38bdf8' }}>{sim.activeAlert.distanceMeters} m</strong> &bull;{' '}
              <strong style={{ color: '#10b981' }}>{sim.activeAlert.etaSeconds} sec</strong>
            </div>
          </div>
        )}

        {/* 8. SMALL FLOATING SIGNAL CLEARED TOAST */}
        {sim.clearedSignal && !sim.activeAlert && (
          <div
            className="animate-slide-down"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '4.5rem',
              width: '230px',
              maxWidth: '85vw',
              backgroundColor: 'rgba(15, 23, 42, 0.96)',
              border: '1.5px solid #10b981',
              borderRadius: '10px',
              padding: '0.5rem 0.7rem',
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f8fafc' }}>
                ✓ SIGNAL CLEARED
              </div>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {sim.clearedSignal.name} &bull; Next signal monitored
              </div>
            </div>
          </div>
        )}

        {/* 9. STEP 5: HOSPITAL ARRIVED SUMMARY MODAL */}
        {sim.workflowStep === 'HOSPITAL_REACHED' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(11, 18, 32, 0.97)',
              border: '1.5px solid #10b981',
              borderRadius: '16px',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 24px rgba(16, 185, 129, 0.25)',
              backdropFilter: 'blur(20px)',
              zIndex: 1200,
              maxWidth: '350px',
              width: '88%',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
              }}
            >
              <CheckCircle2 size={24} />
            </div>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.2rem' }}>
              🏥 ARRIVED AT HOSPITAL
            </h2>

            <p style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 800, margin: '0 0 0.15rem 0' }}>
              {sim.tripStats.hospitalName}
            </p>

            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>
              ✓ Emergency route completed
            </span>

            {/* Trip Stats Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.4rem',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '0.6rem 0.5rem',
                marginBottom: '1.1rem',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase' }}>Travel Distance</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#f8fafc' }}>
                  {sim.tripStats.totalDistanceKm} km
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase' }}>Travel Time</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#10b981' }}>
                  {formatTime(sim.tripStats.elapsedSeconds)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase' }}>Signals Cleared</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#38bdf8' }}>
                  {sim.tripStats.signalsCleared}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCompleteTrip}
              disabled={isCompleting}
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 900,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.5)',
              }}
            >
              <Check size={16} />
              <span>COMPLETE TRIP</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Feedback Toast */}
      {feedbackToast && (
        <Toast
          type={feedbackToast.type}
          title={feedbackToast.title}
          message={feedbackToast.message}
          onClose={() => setFeedbackToast(null)}
        />
      )}
    </div>
  );
};

export default DriverNavigation;
