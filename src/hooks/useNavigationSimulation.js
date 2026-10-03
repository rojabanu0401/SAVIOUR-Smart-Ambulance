import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  DEMO_AMBULANCE_SPEED_KMH,
  calculateDistanceMeters,
  calculateBearing,
  calculateETASeconds,
  getNearbyHospitals,
  calculateDualRoutesToPatient,
  calculateDualRoutesToHospital,
  findNextUpcomingSignal,
} from '../services/navigationService';
import { soundService } from '../utils/soundService';

/**
 * useNavigationSimulation
 * Manages the complete Google Maps-style SAVIOUR Navigation State Machine:
 * 1. LEG1_ROUTE_SELECTION (Route choices: Recommended vs Alternative -> Driver selects & clicks Start)
 * 2. TO_PATIENT (Ambulance moves smoothly along selected route to Patient Pickup)
 * 3. PATIENT_REACHED / HOSPITAL_SELECTION (Arrival at Patient -> Nearby Hospital Discovery)
 * 4. LEG2_ROUTE_SELECTION (Route choices to Hospital: Recommended vs Alternative -> Driver selects & clicks Start)
 * 5. TO_HOSPITAL (Ambulance moves smoothly along selected route to Hospital)
 * 6. HOSPITAL_REACHED (Arrival at Hospital Bay & Trip Summary)
 */
export function useNavigationSimulation({
  startCoords,
  pickupCoords,
}) {
  // Workflow State Machine
  const [workflowStep, setWorkflowStep] = useState('LEG1_ROUTE_SELECTION');

  // Selected Route Types ('recommended' | 'alternative')
  const [selectedLeg1RouteType, setSelectedLeg1RouteType] = useState('recommended');
  const [selectedLeg2RouteType, setSelectedLeg2RouteType] = useState('recommended');

  // Selected Destination Hospital
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Discover Nearby Hospitals around the patient pickup location
  const hospitals = useMemo(() => {
    try {
      return getNearbyHospitals(pickupCoords) || [];
    } catch {
      return [];
    }
  }, [pickupCoords?.latitude, pickupCoords?.longitude]);

  // 1. Calculate Leg 1 Dual Routes: Ambulance -> Patient
  const dualRoutesLeg1 = useMemo(() => {
    try {
      return calculateDualRoutesToPatient(startCoords, pickupCoords);
    } catch (e) {
      console.warn('[useNavigationSimulation] Error calculating Leg 1 dual routes:', e);
      return null;
    }
  }, [startCoords?.latitude, startCoords?.longitude, pickupCoords?.latitude, pickupCoords?.longitude]);

  // 2. Calculate Leg 2 Dual Routes: Patient -> Selected Hospital
  const dualRoutesLeg2 = useMemo(() => {
    if (!selectedHospital) return null;
    try {
      return calculateDualRoutesToHospital(pickupCoords, selectedHospital);
    } catch (e) {
      console.warn('[useNavigationSimulation] Error calculating Leg 2 dual routes:', e);
      return null;
    }
  }, [pickupCoords?.latitude, pickupCoords?.longitude, selectedHospital]);

  // Active Route based on current workflow and selected route choice
  const activeRoute = useMemo(() => {
    const defaultFallback = {
      type: 'recommended',
      name: 'Emergency Route',
      distanceKm: 3.8,
      etaMin: 6,
      waypoints: [],
      coordinates: [],
      trafficSignals: [],
    };

    if (workflowStep === 'LEG2_ROUTE_SELECTION' || workflowStep === 'TO_HOSPITAL' || workflowStep === 'HOSPITAL_REACHED') {
      if (dualRoutesLeg2) {
        return dualRoutesLeg2[selectedLeg2RouteType] || dualRoutesLeg2.recommended || defaultFallback;
      }
    }
    if (dualRoutesLeg1) {
      return dualRoutesLeg1[selectedLeg1RouteType] || dualRoutesLeg1.recommended || defaultFallback;
    }
    return defaultFallback;
  }, [workflowStep, dualRoutesLeg1, selectedLeg1RouteType, dualRoutesLeg2, selectedLeg2RouteType]);

  // Dual Routes object to pass to MapView when in route selection mode
  const currentDualRoutes = useMemo(() => {
    if (workflowStep === 'LEG1_ROUTE_SELECTION') {
      return dualRoutesLeg1;
    }
    if (workflowStep === 'LEG2_ROUTE_SELECTION') {
      return dualRoutesLeg2;
    }
    return null; // During active navigation, only single active route is drawn
  }, [workflowStep, dualRoutesLeg1, dualRoutesLeg2]);

  const selectedRouteType = useMemo(() => {
    if (workflowStep === 'LEG2_ROUTE_SELECTION' || workflowStep === 'TO_HOSPITAL') {
      return selectedLeg2RouteType;
    }
    return selectedLeg1RouteType;
  }, [workflowStep, selectedLeg1RouteType, selectedLeg2RouteType]);

  const waypoints = activeRoute?.waypoints || [];

  // Movement & Telemetry States
  const [currentIndex, setCurrentIndex] = useState(0);
  const speedKmh = DEMO_AMBULANCE_SPEED_KMH || 40; // Fixed 40 km/h
  const [trafficSignals, setTrafficSignals] = useState(activeRoute?.trafficSignals || []);
  const [activeAlert, setActiveAlert] = useState(null);
  const [clearedSignal, setClearedSignal] = useState(null);
  const [followAmbulance, setFollowAmbulance] = useState(false); // Enabled on Start Navigation or DblClick
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [leg1Summary, setLeg1Summary] = useState(null);

  // Sync signals when active route changes
  useEffect(() => {
    if (activeRoute?.trafficSignals) {
      setTrafficSignals(activeRoute.trafficSignals);
    }
  }, [activeRoute]);

  // Refs for stable timer closures
  const timerRef = useRef(null);
  const workflowRef = useRef(workflowStep);
  workflowRef.current = workflowStep;
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;
  const signalsRef = useRef(trafficSignals);
  signalsRef.current = trafficSignals;

  // Current ambulance position & heading
  const currentPosition = useMemo(() => {
    if (!waypoints || waypoints.length === 0) {
      return {
        latitude: Number(startCoords?.latitude) || 12.9352,
        longitude: Number(startCoords?.longitude) || 77.6245,
        heading: 0,
      };
    }
    const safeIdx = Math.min(currentIndex, waypoints.length - 1);
    const curr = waypoints[safeIdx] || { latitude: 12.9352, longitude: 77.6245 };
    const next = waypoints[Math.min(safeIdx + 1, waypoints.length - 1)] || curr;

    const heading = calculateBearing(
      curr.latitude,
      curr.longitude,
      next.latitude,
      next.longitude
    );

    return {
      latitude: curr.latitude,
      longitude: curr.longitude,
      heading,
    };
  }, [waypoints, currentIndex, startCoords]);

  // Total remaining distance and ETA to current leg destination
  const remainingDistanceMeters = useMemo(() => {
    if (!waypoints || waypoints.length === 0) return 0;
    const dest = waypoints[waypoints.length - 1];
    if (!dest) return 0;
    return calculateDistanceMeters(
      currentPosition.latitude,
      currentPosition.longitude,
      dest.latitude,
      dest.longitude
    );
  }, [waypoints, currentPosition]);

  const totalETAMinutes = useMemo(() => {
    const secs = calculateETASeconds(remainingDistanceMeters, speedKmh);
    return Math.max(1, Math.ceil(secs / 60));
  }, [remainingDistanceMeters, speedKmh]);

  // Single Next Upcoming Signal
  const nextSignal = useMemo(() => {
    return findNextUpcomingSignal(currentPosition, trafficSignals, currentIndex);
  }, [currentPosition, trafficSignals, currentIndex]);

  const nextSignalDistanceMeters = nextSignal ? nextSignal.distanceMeters : null;
  const nextSignalETASeconds = nextSignal
    ? calculateETASeconds(nextSignal.distanceMeters, speedKmh)
    : null;

  // Single Step Progression Engine
  const advanceStep = useCallback(() => {
    const currentIdx = indexRef.current;
    const currentWorkflow = workflowRef.current;
    const total = waypoints.length;

    if (total === 0) return;

    if (currentIdx >= total - 1) {
      // Reached destination for current leg!
      if (currentWorkflow === 'TO_PATIENT') {
        const leg1SignalsCleared = (Array.isArray(signalsRef.current) ? signalsRef.current : []).filter((s) => s?.isPassed).length;
        setLeg1Summary({
          distanceKm: activeRoute?.distanceKm || 3.8,
          signalsCleared: leg1SignalsCleared,
        });

        try { soundService.playSignalClearedChime(); } catch {}
        setWorkflowStep('HOSPITAL_SELECTION');
        setActiveAlert(null);
        setClearedSignal(null);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      if (currentWorkflow === 'TO_HOSPITAL') {
        try { soundService.playSignalClearedChime(); } catch {}
        setWorkflowStep('HOSPITAL_REACHED');
        setActiveAlert(null);
        setClearedSignal(null);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      return;
    }

    const nextIdx = currentIdx + 1;
    setCurrentIndex(nextIdx);
    setElapsedSeconds((prev) => prev + 1);

    const currPos = waypoints[nextIdx];
    if (!currPos) return;

    // Check Traffic Signals along the active route
    const currentSignals = Array.isArray(signalsRef.current) ? signalsRef.current : [];
    let signalsUpdated = false;
    const updatedSignals = currentSignals.map((sig) => {
      if (!sig || sig.isPassed) return sig;

      const dist = calculateDistanceMeters(
        currPos.latitude,
        currPos.longitude,
        sig.latitude,
        sig.longitude
      );
      const etaSec = calculateETASeconds(dist, speedKmh);

      // 1. Check for 30-Second Priority Green Trigger (ETA <= 30s)
      if (etaSec <= 30 && !sig.alertTriggered && !sig.isPassed) {
        signalsUpdated = true;
        try { soundService.playSignalApproachingChime(); } catch {}

        setActiveAlert({
          signalId: sig.id,
          name: sig.name,
          roadName: sig.roadName,
          distanceMeters: dist,
          etaSeconds: etaSec,
          action: 'Priority Request Sent',
          isPreempted: true,
        });

        return {
          ...sig,
          state: 'green',
          status: 'GREEN',
          isPreempted: true,
          alertTriggered: true,
        };
      }

      // 2. Check for Signal Clearance (Passed junction waypoint or distance <= 25m)
      if ((nextIdx >= sig.waypointIndex || dist <= 25) && !sig.isPassed) {
        signalsUpdated = true;
        try { soundService.playSignalClearedChime(); } catch {}

        setClearedSignal({
          signalId: sig.id,
          name: sig.name,
          roadName: sig.roadName,
          timestamp: Date.now(),
        });

        setActiveAlert(null);

        return {
          ...sig,
          isPassed: true,
        };
      }

      return sig;
    });

    if (signalsUpdated) {
      setTrafficSignals(updatedSignals);
    }
  }, [waypoints, speedKmh, activeRoute?.distanceKm]);

  // Auto-dismiss cleared signal notification after 3.2 seconds
  useEffect(() => {
    if (!clearedSignal) return;
    const timeout = setTimeout(() => {
      setClearedSignal(null);
    }, 3200);
    return () => clearTimeout(timeout);
  }, [clearedSignal]);

  // Automated Movement Loop — Runs during 'TO_PATIENT' and 'TO_HOSPITAL'
  useEffect(() => {
    if (workflowStep === 'TO_PATIENT' || workflowStep === 'TO_HOSPITAL') {
      try { soundService.unlockAudio(); } catch {}
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        advanceStep();
      }, 900);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [workflowStep, advanceStep]);

  // --- ACTIONS ---

  // Select Route Type in selection screens (Leg 1 or Leg 2)
  const selectRouteType = useCallback((type) => {
    try { soundService.unlockAudio(); } catch {}
    if (workflowStep === 'LEG1_ROUTE_SELECTION') {
      setSelectedLeg1RouteType(type);
    } else if (workflowStep === 'LEG2_ROUTE_SELECTION') {
      setSelectedLeg2RouteType(type);
    }
  }, [workflowStep]);

  // Start Navigation Button Clicked
  const startNavigation = useCallback(() => {
    try {
      soundService.unlockAudio();
      soundService.playNavigationStartChime();
    } catch {}
    setFollowAmbulance(true);
    if (workflowStep === 'LEG1_ROUTE_SELECTION') {
      setCurrentIndex(0);
      setWorkflowStep('TO_PATIENT');
    } else if (workflowStep === 'LEG2_ROUTE_SELECTION') {
      setCurrentIndex(0);
      setWorkflowStep('TO_HOSPITAL');
    }
  }, [workflowStep]);

  // Select Hospital from list -> Moves to Leg 2 Route Selection
  const selectHospital = useCallback((hospital) => {
    try { soundService.unlockAudio(); } catch {}
    setSelectedHospital(hospital);
    setSelectedLeg2RouteType('recommended');
    setCurrentIndex(0);
    setActiveAlert(null);
    setClearedSignal(null);
    setWorkflowStep('LEG2_ROUTE_SELECTION');
  }, []);

  // Total Trip Statistics
  const tripStats = useMemo(() => {
    const leg1Dist = Number(dualRoutesLeg1?.[selectedLeg1RouteType]?.distanceKm) || 3.8;
    const leg2Dist = Number(dualRoutesLeg2?.[selectedLeg2RouteType]?.distanceKm) || (selectedHospital?.distanceKm ? Number(selectedHospital.distanceKm) : 2.4);
    const totalDist = Number((leg1Dist + leg2Dist).toFixed(1));

    const sigsList = Array.isArray(trafficSignals) ? trafficSignals : [];
    const signalsCleared = sigsList.filter((s) => s?.isPassed).length + (leg1Summary?.signalsCleared || 3);

    return {
      totalDistanceKm: totalDist,
      leg1DistanceKm: leg1Dist,
      leg2DistanceKm: leg2Dist,
      elapsedSeconds,
      signalsCleared,
      totalSignals: sigsList.length + (leg1Summary?.signalsCleared || 3),
      hospitalName: selectedHospital?.name || 'Apollo Hospital',
      routeName: `Corridor to ${selectedHospital?.name || 'Hospital'}`,
    };
  }, [dualRoutesLeg1, selectedLeg1RouteType, dualRoutesLeg2, selectedLeg2RouteType, selectedHospital, trafficSignals, leg1Summary, elapsedSeconds]);

  return {
    workflowStep, // 'LEG1_ROUTE_SELECTION' | 'TO_PATIENT' | 'HOSPITAL_SELECTION' | 'LEG2_ROUTE_SELECTION' | 'TO_HOSPITAL' | 'HOSPITAL_REACHED'
    hospitals,
    selectedHospital,
    activeRoute,
    currentDualRoutes,
    selectedRouteType,
    selectRouteType,
    startNavigation,
    currentIndex,
    totalSteps: waypoints.length,
    progressPercent: waypoints.length > 0 ? Math.round((currentIndex / Math.max(1, waypoints.length - 1)) * 100) : 0,
    currentPosition,
    speedKmh, // Fixed 40 km/h
    trafficSignals,
    nextSignal,
    nextSignalDistanceMeters,
    nextSignalETASeconds,
    activeAlert,
    clearedSignal,
    remainingDistanceMeters,
    totalETAMinutes,
    followAmbulance,
    setFollowAmbulance,
    tripStats,
    selectHospital,
  };
}

export default useNavigationSimulation;
