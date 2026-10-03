/**
 * SAVIOUR Advanced Navigation & Traffic Simulation Service
 * Provides hospital discovery around pickup coordinates, dual route calculation
 * (Shortest Route in Blue vs Low-Traffic Route in Green), waypoint interpolation,
 * Haversine geographic distance calculations, dynamic ETA calculations,
 * and 30-second priority green alert evaluation.
 */

// Fixed demo speed in km/h (Strictly 40 km/h)
export const DEMO_AMBULANCE_SPEED_KMH = 40;
export const DEFAULT_DEMO_SPEED_KMH = 40;

/**
 * Calculate geographic distance between two coordinates in meters using the Haversine formula
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371e3; // Earth radius in meters
  const phi1 = (Number(lat1) * Math.PI) / 180;
  const phi2 = (Number(lat2) * Math.PI) / 180;
  const deltaPhi = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const deltaLambda = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculate compass bearing (heading) in degrees from point 1 to point 2
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const phi1 = (Number(lat1) * Math.PI) / 180;
  const phi2 = (Number(lat2) * Math.PI) / 180;
  const deltaLambda = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return Math.round(((theta * 180) / Math.PI + 360) % 360);
}

/**
 * Calculate ETA in seconds: distance (m) / speed (m/s) with fixed 40 km/h
 */
export function calculateETASeconds(distanceMeters, speedKmh = DEMO_AMBULANCE_SPEED_KMH) {
  const speedMs = (speedKmh * 1000) / 3600; // 40 km/h = ~11.11 m/s
  if (speedMs <= 0) return 0;
  return Math.round(distanceMeters / speedMs);
}

/**
 * Format seconds into a clean human readable string (e.g. "29 sec" or "4 min 12 sec")
 */
export function formatETA(seconds) {
  if (seconds <= 0) return '0 sec';
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const mins = Math.floor(seconds / 60);
  const remSecs = Math.round(seconds % 60);
  if (remSecs === 0) return `${mins} min`;
  return `${mins} min ${remSecs} sec`;
}

/**
 * Discover 3-4 nearby hospitals around the emergency patient pickup location
 */
export function getNearbyHospitals(pickupCoords) {
  const pLat = Number(pickupCoords?.latitude) || 12.9716;
  const pLng = Number(pickupCoords?.longitude) || 77.5946;

  return [
    {
      id: 'HOSP-01',
      name: 'Apollo Hospital',
      type: 'Level 1 Trauma Center',
      capability: 'Advanced Emergency Care',
      distanceKm: 2.4,
      etaMin: 5,
      latitude: Number((pLat + 0.0095).toFixed(6)),
      longitude: Number((pLng - 0.0085).toFixed(6)),
      coords: [Number((pLat + 0.0095).toFixed(6)), Number((pLng - 0.0085).toFixed(6))],
      address: 'Greams Road, Central Corridor',
    },
    {
      id: 'HOSP-02',
      name: 'Fortis Emergency Care',
      type: 'Emergency Trauma Hub',
      capability: '24/7 Emergency & Acute Care',
      distanceKm: 4.2,
      etaMin: 7,
      latitude: Number((pLat - 0.0125).toFixed(6)),
      longitude: Number((pLng + 0.0135).toFixed(6)),
      coords: [Number((pLat - 0.0125).toFixed(6)), Number((pLng + 0.0135).toFixed(6))],
      address: 'Arcot Road, Vadapalani',
    },
    {
      id: 'HOSP-03',
      name: 'Government Multi-Specialty Hospital',
      type: 'Public Emergency Center',
      capability: 'Emergency & Trauma Care',
      distanceKm: 5.1,
      etaMin: 8,
      latitude: Number((pLat - 0.0160).toFixed(6)),
      longitude: Number((pLng - 0.0120).toFixed(6)),
      coords: [Number((pLat - 0.0160).toFixed(6)), Number((pLng - 0.0120).toFixed(6))],
      address: 'Omandurar Government Estate',
    },
    {
      id: 'HOSP-04',
      name: 'Manipal Hospital',
      type: 'Super Specialty Hospital',
      capability: 'Multi-Specialty & Critical Care',
      distanceKm: 3.4,
      etaMin: 6,
      latitude: Number((pLat + 0.0155).toFixed(6)),
      longitude: Number((pLng + 0.0110).toFixed(6)),
      coords: [Number((pLat + 0.0155).toFixed(6)), Number((pLng + 0.0110).toFixed(6))],
      address: 'Old Airport Road, East Wing',
    },
  ];
}

/**
 * Generate a dense sequence of interpolated GPS waypoints along a route
 */
export function generateDenseWaypoints(startCoords, destCoords, totalSteps = 60, curveFactor = 0.003) {
  const dLat = Number(startCoords?.latitude) || 12.9352;
  const dLng = Number(startCoords?.longitude) || 77.6245;
  const pLat = Number(destCoords?.latitude) || 12.9716;
  const pLng = Number(destCoords?.longitude) || 77.5946;

  const waypoints = [];
  const deltaLat = pLat - dLat;
  const deltaLng = pLng - dLng;

  // Perpendicular vector for realistic road curves
  const perpLat = -deltaLng;
  const perpLng = deltaLat;
  const len = Math.sqrt(perpLat * perpLat + perpLng * perpLng) || 1;

  for (let i = 0; i <= totalSteps; i++) {
    const t = i / totalSteps;
    const bend = Math.sin(t * Math.PI) * curveFactor;
    const lat = dLat + deltaLat * t + (perpLat / len) * bend;
    const lng = dLng + deltaLng * t + (perpLng / len) * bend;

    waypoints.push({
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      index: i,
    });
  }

  return waypoints;
}

/**
 * Calculate Leg 1 Dual Routes: Ambulance -> Patient Pickup Location (Google Maps Style)
 * 1. Recommended (Low Traffic - Solid Blue)
 * 2. Alternative (Shortest / Heavy Traffic - Slate Gray)
 */
export function calculateDualRoutesToPatient(startCoords, pickupCoords) {
  const directDistance = calculateDistanceMeters(
    startCoords?.latitude || 12.9352,
    startCoords?.longitude || 77.6245,
    pickupCoords?.latitude || 12.9716,
    pickupCoords?.longitude || 77.5946
  );

  const directDistKm = directDistance / 1000;

  // Option 1: Recommended Route (Low-Traffic Corridor - BLUE)
  const recommendedWaypoints = generateDenseWaypoints(startCoords, pickupCoords, 60, 0.0028);
  const recommendedSignals = createRouteTrafficSignals(recommendedWaypoints, [
    { id: 'SIG-P1', name: 'Anna Salai Junction', roadName: 'Anna Salai Arterial', initialState: 'red', waitTimeSec: 25 },
    { id: 'SIG-P2', name: 'Mount Road - Gemini Flyover', roadName: 'Mount Road Corridor', initialState: 'red', waitTimeSec: 30 },
    { id: 'SIG-P3', name: 'Saidapet Metro Signal', roadName: 'Saidapet Metro Intersection', initialState: 'yellow', waitTimeSec: 20 },
  ]);

  // Option 2: Alternative Route (Direct / Heavy Traffic - GRAY)
  const alternativeWaypoints = generateDenseWaypoints(startCoords, pickupCoords, 60, -0.0035);
  const alternativeSignals = createRouteTrafficSignals(alternativeWaypoints, [
    { id: 'SIG-PA1', name: 'Central Arterial Grid #1', roadName: 'Central Arterial Way', initialState: 'red', waitTimeSec: 40 },
    { id: 'SIG-PA2', name: 'Commercial Square Junction', roadName: 'Commercial Way', initialState: 'red', waitTimeSec: 35 },
    { id: 'SIG-PA3', name: 'Expressway Interchange', roadName: 'Expressway Ramp', initialState: 'yellow', waitTimeSec: 25 },
  ]);

  return {
    recommended: {
      type: 'recommended',
      name: 'Recommended Route',
      title: '🔵 Recommended',
      subtitle: 'Easy + Low Traffic',
      tag: 'LOW TRAFFIC',
      color: '#2563eb', // Solid Blue
      distanceKm: Math.max(3.8, Number(((directDistKm * 1.25)).toFixed(1))),
      etaMin: Math.max(5, Math.round(directDistKm * 1.5)),
      trafficCondition: 'Easy + Low Traffic Corridor',
      isDefault: true,
      waypoints: recommendedWaypoints,
      coordinates: recommendedWaypoints.map((w) => [w.latitude, w.longitude]),
      trafficSignals: recommendedSignals,
    },
    alternative: {
      type: 'alternative',
      name: 'Alternative Route',
      title: '⚪ Alternative',
      subtitle: 'Shortest Route • Heavy Traffic',
      tag: 'HEAVY TRAFFIC',
      color: '#64748b', // Slate Gray
      distanceKm: Math.max(3.2, Number(((directDistKm * 1.05)).toFixed(1))),
      etaMin: Math.max(6, Math.round(directDistKm * 1.8)),
      trafficCondition: 'Heavy Urban Congestion',
      isDefault: false,
      waypoints: alternativeWaypoints,
      coordinates: alternativeWaypoints.map((w) => [w.latitude, w.longitude]),
      trafficSignals: alternativeSignals,
    },
  };
}

/**
 * Calculate Leg 2 Dual Routes: Patient -> Selected Destination Hospital (Google Maps Style)
 * 1. Recommended (Low Traffic Corridor - Solid Blue)
 * 2. Alternative (Shortest / Heavy Traffic - Slate Gray)
 */
export function calculateDualRoutesToHospital(pickupCoords, hospital) {
  const hLat = Number(hospital?.latitude || hospital?.coords?.[0]) || 12.9811;
  const hLng = Number(hospital?.longitude || hospital?.coords?.[1]) || 77.5861;

  const directDistance = calculateDistanceMeters(
    pickupCoords?.latitude || 12.9716,
    pickupCoords?.longitude || 77.5946,
    hLat,
    hLng
  );

  const directDistKm = directDistance / 1000;
  const baseHospitalDist = hospital?.distanceKm || Number(((directDistKm * 1.22)).toFixed(1));

  // Option 1: Recommended Route (Low-Traffic Medical Corridor - BLUE)
  const recommendedWaypoints = generateDenseWaypoints(pickupCoords, { latitude: hLat, longitude: hLng }, 60, -0.0028);
  const recommendedSignals = createRouteTrafficSignals(recommendedWaypoints, [
    { id: 'SIG-H1', name: 'Medical District Access Gate', roadName: 'Hospital Approach Way', initialState: 'red', waitTimeSec: 20 },
    { id: 'SIG-H2', name: 'Teynampet Medical Junction', roadName: 'Teynampet Arterial', initialState: 'red', waitTimeSec: 25 },
    { id: 'SIG-H3', name: 'Apollo Emergency Bay Entry', roadName: 'Hospital Perimeter Road', initialState: 'yellow', waitTimeSec: 15 },
  ]);

  // Option 2: Alternative Route (Shortest / Urban Traffic - GRAY)
  const alternativeWaypoints = generateDenseWaypoints(pickupCoords, { latitude: hLat, longitude: hLng }, 60, 0.0035);
  const alternativeSignals = createRouteTrafficSignals(alternativeWaypoints, [
    { id: 'SIG-HA1', name: 'Inner City Signal #4', roadName: 'Market Corridor', initialState: 'red', waitTimeSec: 35 },
    { id: 'SIG-HA2', name: 'East Ring Road Bypass', roadName: 'East Ring Way', initialState: 'red', waitTimeSec: 30 },
  ]);

  return {
    recommended: {
      type: 'recommended',
      name: `Recommended Route to ${hospital?.name || 'Hospital'}`,
      title: '🔵 Recommended',
      subtitle: 'Low Traffic Emergency Corridor',
      tag: 'LOW TRAFFIC',
      color: '#2563eb', // Solid Blue
      distanceKm: Math.max(baseHospitalDist, 4.2),
      etaMin: hospital?.etaMin || Math.max(6, Math.round(baseHospitalDist * 1.5)),
      trafficCondition: 'Priority Green Emergency Corridor',
      isDefault: true,
      waypoints: recommendedWaypoints,
      coordinates: recommendedWaypoints.map((w) => [w.latitude, w.longitude]),
      trafficSignals: recommendedSignals,
    },
    alternative: {
      type: 'alternative',
      name: `Alternative Route to ${hospital?.name || 'Hospital'}`,
      title: '⚪ Alternative',
      subtitle: 'Shortest • Heavy Congestion',
      tag: 'HEAVY TRAFFIC',
      color: '#64748b', // Slate Gray
      distanceKm: Math.max(Number((baseHospitalDist * 0.85).toFixed(1)), 3.5),
      etaMin: Math.max(hospital?.etaMin ? hospital.etaMin + 1 : 7, 7),
      trafficCondition: 'Heavy Urban Congestion',
      isDefault: false,
      waypoints: alternativeWaypoints,
      coordinates: alternativeWaypoints.map((w) => [w.latitude, w.longitude]),
      trafficSignals: alternativeSignals,
    },
  };
}

/**
 * Initialize realistic traffic signals positioned along route waypoints
 */
export function createRouteTrafficSignals(waypoints, customDefinitions = null) {
  if (!Array.isArray(waypoints) || waypoints.length === 0) return [];

  const total = waypoints.length;
  const numSignals = customDefinitions?.length || 4;
  const stepFraction = 1 / (numSignals + 1);

  const signalIndices = Array.from({ length: numSignals }, (_, i) =>
    Math.floor(total * (stepFraction * (i + 1)))
  );

  const defaultDefinitions = [
    { id: 'SIG-101', name: 'Anna Salai - Spencer Junction', roadName: 'Anna Salai Arterial', initialState: 'red', waitTimeSec: 25 },
    { id: 'SIG-102', name: 'Mount Road - Gemini Flyover', roadName: 'Mount Road Corridor', initialState: 'red', waitTimeSec: 35 },
    { id: 'SIG-103', name: 'Saidapet Metro Signal', roadName: 'Saidapet Metro Intersection', initialState: 'yellow', waitTimeSec: 20 },
    { id: 'SIG-104', name: 'Teynampet Medical Junction', roadName: 'Medical District Access Road', initialState: 'red', waitTimeSec: 15 },
  ];

  const definitions = customDefinitions || defaultDefinitions;

  return signalIndices.map((wpIndex, i) => {
    const wp = waypoints[Math.min(wpIndex, total - 1)];
    const def = definitions[i] || {
      id: `SIG-10${i + 1}`,
      name: `Signal Junction #${i + 1}`,
      roadName: `Main Corridor Junction #${i + 1}`,
      initialState: 'red',
      waitTimeSec: 20,
    };

    return {
      id: def.id,
      name: def.name,
      roadName: def.roadName,
      latitude: wp.latitude,
      longitude: wp.longitude,
      coords: [wp.latitude, wp.longitude],
      waypointIndex: wpIndex,
      state: def.initialState, // 'red' | 'yellow' | 'green'
      status: def.initialState.toUpperCase(),
      timerSec: def.waitTimeSec,
      isPreempted: false, // Turned true when 30s priority alert triggers
      isPassed: false, // Turned true when ambulance passes the signal
      alertTriggered: false, // Triggered only once per signal
    };
  });
}

/**
 * Identify the single next upcoming traffic signal on the route
 */
export function findNextUpcomingSignal(ambulanceCoords, trafficSignals, currentWaypointIndex = 0) {
  if (!ambulanceCoords || !Array.isArray(trafficSignals) || trafficSignals.length === 0) {
    return null;
  }

  // Filter out signals that have already been passed
  const pendingSignals = trafficSignals.filter((s) => !s.isPassed);
  if (pendingSignals.length === 0) return null;

  let nextSignal = pendingSignals.find((s) => s.waypointIndex >= currentWaypointIndex);

  if (!nextSignal) {
    let minDistance = Infinity;
    for (const sig of pendingSignals) {
      const dist = calculateDistanceMeters(
        ambulanceCoords.latitude,
        ambulanceCoords.longitude,
        sig.latitude,
        sig.longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        nextSignal = sig;
      }
    }
  }

  if (!nextSignal) return null;

  const distanceMeters = calculateDistanceMeters(
    ambulanceCoords.latitude,
    ambulanceCoords.longitude,
    nextSignal.latitude,
    nextSignal.longitude
  );

  return {
    ...nextSignal,
    distanceMeters,
  };
}

/**
 * Calculate single best route to patient (Recommended Low-Traffic Corridor)
 */
export function calculateRouteToPatient(startCoords, pickupCoords) {
  const dual = calculateDualRoutesToPatient(startCoords, pickupCoords);
  return dual.recommended;
}

/**
 * Calculate single best route to hospital (Recommended Low-Traffic Corridor)
 */
export function calculateRouteToHospital(pickupCoords, hospital) {
  const dual = calculateDualRoutesToHospital(pickupCoords, hospital);
  return dual.recommended;
}

export const navigationService = {
  DEMO_AMBULANCE_SPEED_KMH,
  DEFAULT_DEMO_SPEED_KMH,
  calculateDistanceMeters,
  calculateBearing,
  calculateETASeconds,
  formatETA,
  getNearbyHospitals,
  calculateRouteToPatient,
  calculateDualRoutesToPatient,
  calculateRouteToHospital,
  calculateDualRoutesToHospital,
  generateDenseWaypoints,
  createRouteTrafficSignals,
  findNextUpcomingSignal,
};

export default navigationService;
