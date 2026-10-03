import { supabase } from '../config/supabase';

/**
 * SAVIOUR Advanced Traffic & Navigation Signal Service
 * Provides multi-segment route conditions, real-time junction traffic light simulation,
 * distance calculation, upcoming signal alerts (<= 300m), and Green Wave Priority override.
 */

// Haversine distance calculation in meters between two GPS coordinates
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Helper to interpolate between two GPS coordinates with realistic road bends
function interpolateRoutePoints(start, end, numPoints = 28, curveOffset = 0.0035) {
  const points = [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  // Midpoint normal vector for realistic road curves
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const perpLat = -dLng;
  const perpLng = dLat;
  const len = Math.sqrt(perpLat * perpLat + perpLng * perpLng) || 1;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Sinusoidal curve for realistic city roads & flyovers
    const bend = Math.sin(t * Math.PI) * curveOffset;
    const lat = lat1 + dLat * t + (perpLat / len) * bend;
    const lng = lng1 + dLng * t + (perpLng / len) * bend;
    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }
  return points;
}

// Generate alternative route with different curvature / detour
function generateAltRoutePoints(start, end, numPoints = 22) {
  const points = [];
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const perpLat = dLng;
  const perpLng = -dLat;
  const len = Math.sqrt(perpLat * perpLat + perpLng * perpLng) || 1;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const bend = Math.sin(t * Math.PI) * 0.0075;
    const lat = lat1 + dLat * t + (perpLat / len) * bend;
    const lng = lng1 + dLng * t + (perpLng / len) * bend;
    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }
  return points;
}

export const trafficService = {
  isDemoTrafficMode: true,

  /**
   * Calculate full multi-segment traffic conditions and traffic light signals for a trip
   */
  calculateRouteTraffic(driverCoords, pickupCoords) {
    const dLat = Number(driverCoords.latitude) || 12.9352;
    const dLng = Number(driverCoords.longitude) || 77.6245;
    const pLat = Number(pickupCoords.latitude) || 12.9716;
    const pLng = Number(pickupCoords.longitude) || 77.5946;

    const start = [dLat, dLng];
    const end = [pLat, pLng];

    const rawPoints = interpolateRoutePoints(start, end, 28, 0.0035);
    const altPoints = generateAltRoutePoints(start, end, 22);

    // Segment the route into 3 traffic sections:
    const len = rawPoints.length;
    const p1 = Math.floor(len * 0.35);
    const p2 = Math.floor(len * 0.7);

    const segments = [
      {
        id: 'seg-1',
        name: 'Sector A: Arterial Corridor',
        condition: 'smooth',
        color: '#10b981', // Traffic Green
        speedLimitKm: 50,
        coordinates: rawPoints.slice(0, p1 + 1),
      },
      {
        id: 'seg-2',
        name: 'Sector B: Commercial Hub & Flyover',
        condition: 'heavy',
        color: '#ef4444', // Traffic Red
        speedLimitKm: 18,
        coordinates: rawPoints.slice(p1, p2 + 1),
      },
      {
        id: 'seg-3',
        name: 'Sector C: Medical District Approach',
        condition: 'moderate',
        color: '#f59e0b', // Traffic Yellow
        speedLimitKm: 32,
        coordinates: rawPoints.slice(p2),
      },
    ];

    // Place realistic traffic lights along junctions on the route
    const junctionIndices = [
      Math.floor(len * 0.22),
      Math.floor(len * 0.48),
      Math.floor(len * 0.72),
      Math.floor(len * 0.90),
    ];

    const junctionNames = [
      'Anna Salai - Spencer Junction',
      'Mount Road - Gemini Flyover',
      'Saidapet Metro Signal',
      'Teynampet Medical Junction',
    ];

    const waitTimes = [25, 35, 20, 15];
    const initialStates = ['red', 'yellow', 'green', 'red'];

    const trafficLights = junctionIndices.map((idx, i) => {
      const pt = rawPoints[Math.min(idx, len - 1)];
      const distFromStart = calculateDistanceMeters(dLat, dLng, pt[0], pt[1]);

      return {
        id: `SIG-10${i + 1}`,
        name: junctionNames[i] || `Signal Junction #${i + 1}`,
        roadName: junctionNames[i],
        coords: pt,
        latitude: pt[0],
        longitude: pt[1],
        state: initialStates[i % initialStates.length],
        status: initialStates[i % initialStates.length].toUpperCase(),
        cycleTimeSec: 45,
        timerSec: waitTimes[i] || 25,
        waitTimeSec: waitTimes[i] || 25,
        distFromStart,
        isPreempted: false,
      };
    });

    // Nearby Hospitals / Landmarks
    const midPoint = rawPoints[Math.floor(len * 0.55)];
    const hospitals = [
      {
        id: 'HOSP-01',
        name: 'Apollo Hospital Emergency Trauma Base',
        type: 'hospital',
        coords: [
          Number((midPoint[0] + 0.0035).toFixed(6)),
          Number((midPoint[1] - 0.003).toFixed(6)),
        ],
        emergencyBeds: 14,
        icuAvailable: true,
      },
      {
        id: 'HOSP-02',
        name: 'Government Multi-Specialty Hospital',
        type: 'hospital',
        coords: [
          Number((rawPoints[p1][0] - 0.003).toFixed(6)),
          Number((rawPoints[p1][1] + 0.004).toFixed(6)),
        ],
        emergencyBeds: 8,
        icuAvailable: true,
      },
    ];

    const totalDirectDistance = calculateDistanceMeters(dLat, dLng, pLat, pLng);
    const estimatedDistanceKm = Number(((totalDirectDistance * 1.25) / 1000).toFixed(1));

    return {
      allPoints: rawPoints,
      segments,
      altRoute: {
        name: 'Alternative Route (via Ring Road)',
        coordinates: altPoints,
        distanceKm: Number((estimatedDistanceKm * 1.15).toFixed(1)),
        etaMin: Math.round(estimatedDistanceKm * 2.2),
      },
      trafficLights,
      hospitals,
      trafficDelayMin: 2,
      trafficLevel: 'Moderate',
      etaMin: Math.max(3, Math.round(estimatedDistanceKm * 1.8)),
      distanceKm: estimatedDistanceKm,
    };
  },

  /**
   * Determine the most relevant upcoming traffic signal for the ambulance
   * Alert triggers when distance <= thresholdMeters (default: 300 meters)
   */
  getUpcomingSignalAlert(ambulanceCoords, trafficSignals, thresholdMeters = 300, passedSignalIds = []) {
    if (!ambulanceCoords || !Array.isArray(trafficSignals) || trafficSignals.length === 0) {
      return null;
    }

    const aLat = Number(ambulanceCoords.latitude);
    const aLng = Number(ambulanceCoords.longitude);

    let closestSignal = null;
    let minDistance = Infinity;

    for (const signal of trafficSignals) {
      if (passedSignalIds.includes(signal.id)) continue;

      const sLat = Number(signal.latitude || signal.coords?.[0]);
      const sLng = Number(signal.longitude || signal.coords?.[1]);
      if (!sLat || !sLng) continue;

      const dist = calculateDistanceMeters(aLat, aLng, sLat, sLng);

      if (dist <= thresholdMeters && dist < minDistance) {
        minDistance = dist;
        closestSignal = {
          ...signal,
          distanceMeters: dist,
        };
      }
    }

    if (!closestSignal) return null;

    const normalizedState = (closestSignal.state || closestSignal.status || 'red').toLowerCase();

    let title = 'TRAFFIC SIGNAL AHEAD';
    let message = 'Prepare to slow down';
    let priorityAction = 'PRIORITY PASSAGE REQUESTED';

    if (normalizedState === 'red') {
      title = 'RED SIGNAL AHEAD';
      message = 'Prepare to slow down &bull; Emergency green wave requested';
      priorityAction = 'PRIORITY PASSAGE REQUESTED';
    } else if (normalizedState === 'yellow') {
      title = 'YELLOW SIGNAL AHEAD';
      message = 'Proceed with caution';
      priorityAction = 'PRIORITY ROUTE ACTIVE';
    } else if (normalizedState === 'green') {
      title = 'GREEN SIGNAL AHEAD';
      message = 'Clear passage &bull; Maintain speed';
      priorityAction = 'SIGNAL CLEARED — PROCEED';
    }

    return {
      signalId: closestSignal.id,
      name: closestSignal.name || closestSignal.roadName,
      roadName: closestSignal.roadName || closestSignal.name,
      state: normalizedState,
      status: normalizedState.toUpperCase(),
      distanceMeters: closestSignal.distanceMeters,
      estimatedWaitSec: closestSignal.timerSec || closestSignal.waitTimeSec || 25,
      isPreempted: closestSignal.isPreempted || false,
      title,
      message,
      priorityAction,
    };
  },

  /**
   * Request Green Light Preemption (Emergency Green Wave Override)
   * Converts targeted traffic signals to GREEN for priority ambulance clearance.
   */
  async requestSignalPriority(signalId) {
    console.log(`[trafficService] 🚨 Priority Passage Activated for signal ${signalId}`);
    return {
      success: true,
      signalId,
      state: 'green',
      status: 'GREEN',
      preempted: true,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Get dynamic next state for traffic light cycling
   */
  getNextSignalState(currentState) {
    const s = (currentState || 'red').toLowerCase();
    switch (s) {
      case 'red':
        return 'green';
      case 'green':
        return 'yellow';
      case 'yellow':
        return 'red';
      default:
        return 'green';
    }
  },

  /**
   * Fetch all traffic signals from Supabase (if connected)
   */
  async getTrafficSignals() {
    try {
      const { data, error } = await supabase.from('traffic_signals').select('*').limit(10);
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('[trafficService] Supabase fallback to local generator:', e.message);
    }
    return [];
  },
};

export default trafficService;

