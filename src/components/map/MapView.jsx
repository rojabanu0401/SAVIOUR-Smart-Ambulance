import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Plus,
  Minus,
  Locate,
  Crosshair,
  Loader2,
} from 'lucide-react';

// Helper function to build vertical 3-bulb traffic light HTML
function getTrafficSignalHtml(tl) {
  const state = String(tl.state || tl.status || 'red').toLowerCase();
  const isPreempted = Boolean(tl.isPreempted);
  const isPassed = Boolean(tl.isPassed);
  const junctionName = String(tl.name || tl.roadName || 'Traffic Junction');

  const isRedActive = state === 'red' && !isPassed;
  const isYellowActive = state === 'yellow' && !isPassed;
  const isGreenActive = state === 'green' || isPassed || isPreempted;

  return `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
      ${
        isPreempted && !isPassed
          ? `<div style="
              position: absolute;
              top: -8px;
              width: 38px;
              height: 48px;
              border-radius: 12px;
              background: rgba(16, 185, 129, 0.35);
              border: 2px solid #10b981;
              animation: pulse-ring 1.4s infinite ease-out;
              z-index: 1;
            "></div>`
          : ''
      }
      <div style="
        background: #0f172a;
        border: 2px solid ${isPreempted ? '#10b981' : '#334155'};
        border-radius: 6px;
        padding: 3px 2px;
        width: 18px;
        display: flex;
        flex-direction: column;
        gap: 2.5px;
        align-items: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.6)${isPreempted ? ', 0 0 14px rgba(16, 185, 129, 0.7)' : ''};
        z-index: 2;
        opacity: ${isPassed ? '0.75' : '1.0'};
      ">
        <div style="
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: ${isRedActive ? '#ef4444' : '#1e293b'};
          border: 1px solid ${isRedActive ? '#fca5a5' : '#0f172a'};
          box-shadow: ${isRedActive ? '0 0 10px #ef4444' : 'none'};
        "></div>
        <div style="
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: ${isYellowActive ? '#f59e0b' : '#1e293b'};
          border: 1px solid ${isYellowActive ? '#fde68a' : '#0f172a'};
          box-shadow: ${isYellowActive ? '0 0 10px #f59e0b' : 'none'};
        "></div>
        <div style="
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: ${isGreenActive ? '#10b981' : '#1e293b'};
          border: 1px solid ${isGreenActive ? '#a7f3d0' : '#0f172a'};
          box-shadow: ${isGreenActive ? '0 0 12px #10b981' : 'none'};
        "></div>
      </div>

      <div style="
        margin-top: 3px;
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid ${isPreempted ? '#10b981' : '#475569'};
        border-radius: 4px;
        padding: 1.5px 5px;
        font-size: 8px;
        font-weight: 700;
        color: #f8fafc;
        white-space: nowrap;
        text-align: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        gap: 3px;
        z-index: 2;
      ">
        <span>🚦</span>
        <span>${junctionName}</span>
        ${isPassed ? '<span style="color: #10b981; font-weight: 900;">✓</span>' : ''}
      </div>
    </div>
  `;
}

export const MapView = React.memo(({
  driverCoords = { latitude: 12.9352, longitude: 77.6245, name: 'Ambulance Unit' },
  pickupCoords = { latitude: 12.9716, longitude: 77.5946, name: 'Patient Pickup' },
  hospitals = [],
  selectedHospital = null,
  showHospitals = false,
  onSelectHospital = null,
  route = null,
  dualRoutes = null,
  selectedRouteType = 'recommended',
  onSelectRouteType = null,
  distanceKm = 3.8,
  etaMin = 6,
  pickupAddress = 'Anna Salai, Near Spencer Plaza Mall, Chennai',
  driverName = 'Rahul Sharma',
  ambulanceNumber = 'KA-01-EA-1088',
  ambulanceType = 'Advanced Life Support',
  showStandbyMode = false,
  externalTrafficLights = null,
  showControls = true,
  followAmbulance = false,
  onToggleFollow = null,
  onAmbulanceDblClick = null,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupsRef = useRef({
    tileLayer: null,
    routes: null,
    alternativeRoutes: null,
    signals: null,
    markers: null,
    hospitals: null,
  });
  const markersRef = useRef({
    ambulance: null,
    pickup: null,
    hospital: null,
    signals: {},
  });
  const signalStatesRef = useRef({});
  const routeSignatureRef = useRef('');
  const hospitalsKeyRef = useRef('');
  const hasInitialFitRef = useRef(false);
  const [tilesLoading, setTilesLoading] = useState(true);

  // Callback refs to keep handlers up to date without triggering useEffect rebuilds
  const onSelectRouteTypeRef = useRef(onSelectRouteType);
  onSelectRouteTypeRef.current = onSelectRouteType;
  const onSelectHospitalRef = useRef(onSelectHospital);
  onSelectHospitalRef.current = onSelectHospital;
  const onAmbulanceDblClickRef = useRef(onAmbulanceDblClick);
  onAmbulanceDblClickRef.current = onAmbulanceDblClick;
  const onToggleFollowRef = useRef(onToggleFollow);
  onToggleFollowRef.current = onToggleFollow;

  // 1. INITIALIZE LEAFLET MAP ONCE ON MOUNT (SINGLE INSTANCE LIFECYCLE)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof window === 'undefined' || !window.L) {
      console.warn('[MapView] Leaflet window.L not yet loaded.');
      return;
    }

    const L = window.L;

    // Clean up prior instance if exists on this DOM node
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('[MapView] Error removing previous map instance:', e);
      }
      mapInstanceRef.current = null;
    }

    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const dLat = Number(driverCoords?.latitude) || 12.9352;
    const dLng = Number(driverCoords?.longitude) || 77.6245;
    const pLat = Number(pickupCoords?.latitude) || 12.9716;
    const pLng = Number(pickupCoords?.longitude) || 77.5946;

    const centerLat = (dLat + pLat) / 2;
    const centerLng = (dLng + pLng) / 2;

    let map = null;
    try {
      map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
        doubleClickZoom: false, // Custom dblclick handler for smooth ambulance zoom
        preferCanvas: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
      });
      mapInstanceRef.current = map;
    } catch (err) {
      console.warn('[MapView] Map creation error:', err);
      return;
    }

    // High Performance OpenStreetMap Base Tile Layer
    try {
      const osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
        keepBuffer: 2, // Keeps 2 rows/cols of surrounding tiles in memory
        updateWhenZooming: false, // Smooth zooming without flickering
        updateWhenIdle: true, // Efficient idle tile loading
      });

      osmTileLayer.on('loading', () => setTilesLoading(true));
      osmTileLayer.on('load', () => setTilesLoading(false));
      osmTileLayer.on('tileerror', () => setTilesLoading(false));
      osmTileLayer.addTo(map);
      layerGroupsRef.current.tileLayer = osmTileLayer;
    } catch (err) {
      console.warn('[MapView] TileLayer error:', err);
    }

    // Create persistent LayerGroups attached to map
    layerGroupsRef.current.alternativeRoutes = L.layerGroup().addTo(map);
    layerGroupsRef.current.routes = L.layerGroup().addTo(map);
    layerGroupsRef.current.signals = L.layerGroup().addTo(map);
    layerGroupsRef.current.markers = L.layerGroup().addTo(map);
    layerGroupsRef.current.hospitals = L.layerGroup().addTo(map);

    // Initial map container size invalidation
    const rafId = requestAnimationFrame(() => {
      if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
        try { mapInstanceRef.current.invalidateSize(); } catch {}
      }
    });

    const timer1 = setTimeout(() => {
      if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
        try { mapInstanceRef.current.invalidateSize(); } catch {}
      }
    }, 80);

    const timer2 = setTimeout(() => {
      if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
        try { mapInstanceRef.current.invalidateSize(); } catch {}
      }
    }, 300);

    // Throttled ResizeObserver for parent container layout changes
    let resizeObserver = null;
    let resizeThrottleTimer = null;
    let lastWidth = 0;
    let lastHeight = 0;

    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (Math.abs(width - lastWidth) > 2 || Math.abs(height - lastHeight) > 2) {
            lastWidth = width;
            lastHeight = height;
            if (resizeThrottleTimer) clearTimeout(resizeThrottleTimer);
            resizeThrottleTimer = setTimeout(() => {
              if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
                try {
                  mapInstanceRef.current.invalidateSize();
                } catch {}
              }
            }, 120);
          }
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Window resize event handler
    let windowResizeTimer = null;
    const handleWindowResize = () => {
      if (windowResizeTimer) clearTimeout(windowResizeTimer);
      windowResizeTimer = setTimeout(() => {
        if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
          try {
            mapInstanceRef.current.invalidateSize();
          } catch {}
        }
      }, 150);
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (resizeThrottleTimer) clearTimeout(resizeThrottleTimer);
      if (windowResizeTimer) clearTimeout(windowResizeTimer);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        delete mapContainerRef.current._leaflet_id;
      }
      markersRef.current = { ambulance: null, pickup: null, hospital: null, signals: {} };
      signalStatesRef.current = {};
      routeSignatureRef.current = '';
      hospitalsKeyRef.current = '';
      hasInitialFitRef.current = false;
    };
  }, []); // Mount EXACTLY ONCE

  // 2. UPDATE ROUTE POLYLINES (ONLY WHEN ROUTE GEOMETRY OR SELECTION ACTUALLY CHANGES)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window?.L;
    if (!map || !L || !layerGroupsRef.current.routes) return;

    // Calculate a unique signature for current route state
    const signature = dualRoutes
      ? `dual-${selectedRouteType}-${dualRoutes.recommended?.coordinates?.length || 0}-${dualRoutes.alternative?.coordinates?.length || 0}`
      : `single-${route?.name || ''}-${route?.coordinates?.length || 0}`;

    // Skip polyline rebuild if route geometry has not changed
    if (routeSignatureRef.current === signature) {
      return;
    }
    routeSignatureRef.current = signature;

    try {
      layerGroupsRef.current.routes.clearLayers();
      if (layerGroupsRef.current.alternativeRoutes) {
        layerGroupsRef.current.alternativeRoutes.clearLayers();
      }

      const boundsItems = [];

      // Case A: Dual routes available (Route Selection mode)
      if (dualRoutes) {
        const recRoute = dualRoutes.recommended;
        const altRoute = dualRoutes.alternative;

        // Alternative Route Polyline
        if (altRoute && Array.isArray(altRoute.coordinates) && altRoute.coordinates.length > 0) {
          const isAltSelected = selectedRouteType === 'alternative';
          const altPolyline = L.polyline(altRoute.coordinates, {
            color: isAltSelected ? '#2563eb' : '#64748b',
            weight: isAltSelected ? 6.5 : 4,
            opacity: isAltSelected ? 1.0 : 0.65,
            dashArray: isAltSelected ? null : '6, 6',
            lineCap: 'round',
            lineJoin: 'round',
          });

          altPolyline.on('click', () => {
            if (onSelectRouteTypeRef.current) onSelectRouteTypeRef.current('alternative');
          });

          if (layerGroupsRef.current.alternativeRoutes) {
            layerGroupsRef.current.alternativeRoutes.addLayer(altPolyline);
          }
          boundsItems.push(altPolyline);
        }

        // Recommended Route Polyline
        if (recRoute && Array.isArray(recRoute.coordinates) && recRoute.coordinates.length > 0) {
          const isRecSelected = selectedRouteType === 'recommended';

          if (isRecSelected) {
            const casing = L.polyline(recRoute.coordinates, {
              color: '#080C14',
              weight: 9,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            });
            layerGroupsRef.current.routes.addLayer(casing);
          }

          const recPolyline = L.polyline(recRoute.coordinates, {
            color: isRecSelected ? '#2563eb' : '#64748b',
            weight: isRecSelected ? 6.5 : 4,
            opacity: isRecSelected ? 1.0 : 0.65,
            lineCap: 'round',
            lineJoin: 'round',
          });

          recPolyline.on('click', () => {
            if (onSelectRouteTypeRef.current) onSelectRouteTypeRef.current('recommended');
          });

          layerGroupsRef.current.routes.addLayer(recPolyline);
          boundsItems.push(recPolyline);
        }
      } else if (route && Array.isArray(route.coordinates) && route.coordinates.length > 0) {
        // Case B: Single Active Route (During active movement)
        const casing = L.polyline(route.coordinates, {
          color: '#080C14',
          weight: 9,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        });
        layerGroupsRef.current.routes.addLayer(casing);
        boundsItems.push(casing);

        const mainPolyline = L.polyline(route.coordinates, {
          color: '#2563eb', // Solid Smooth Blue
          weight: 6.5,
          opacity: 1.0,
          lineCap: 'round',
          lineJoin: 'round',
        });
        layerGroupsRef.current.routes.addLayer(mainPolyline);
        boundsItems.push(mainPolyline);
      }

      // Fit bounds once when route is loaded
      if (!hasInitialFitRef.current && boundsItems.length > 0 && map._loaded) {
        try {
          const group = L.featureGroup(boundsItems);
          map.fitBounds(group.getBounds().pad(0.18), { maxZoom: 15 });
          hasInitialFitRef.current = true;
        } catch {}
      }
    } catch (e) {
      console.warn('[MapView] Route polyline update error:', e);
    }
  }, [route, dualRoutes, selectedRouteType]);

  // 3. UPDATE HOSPITALS LAYER (ONLY WHEN IN HOSPITAL SELECTION OR SELECTED)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window?.L;
    if (!map || !L || !layerGroupsRef.current.hospitals) return;

    const hospKey = `${showHospitals}-${selectedHospital?.id || ''}-${Array.isArray(hospitals) ? hospitals.length : 0}`;
    if (hospitalsKeyRef.current === hospKey) return;
    hospitalsKeyRef.current = hospKey;

    try {
      layerGroupsRef.current.hospitals.clearLayers();

      if (showHospitals && Array.isArray(hospitals) && hospitals.length > 0) {
        hospitals.forEach((hosp) => {
          if (!hosp) return;
          const isSelected = hosp.id === selectedHospital?.id;
          const hLat = Number(hosp.latitude || hosp.coords?.[0]);
          const hLng = Number(hosp.longitude || hosp.coords?.[1]);
          if (!hLat || !hLng) return;

          const hospHtml = `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              gap: 4px;
              background: rgba(15, 23, 42, 0.95);
              border: ${isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.2)'};
              border-radius: 6px;
              padding: 3px 6px;
              color: ${isSelected ? '#38bdf8' : '#cbd5e1'};
              font-size: 10px;
              font-weight: 700;
              white-space: nowrap;
              transform: translate(-50%, -50%);
              box-shadow: ${isSelected ? '0 0 16px rgba(56, 189, 248, 0.7)' : '0 2px 8px rgba(0,0,0,0.5)'};
              cursor: pointer;
            ">
              <span>🏥</span>
              <span>${hosp.name || 'Hospital'}</span>
              ${isSelected ? '<span style="background: #0284c7; color: #fff; font-size: 8px; padding: 1px 4px; border-radius: 3px;">DESTINATION</span>' : ''}
            </div>
          `;

          const hospIcon = L.divIcon({
            className: 'custom-nearby-hosp-marker',
            html: hospHtml,
            iconSize: [0, 0],
          });

          const hospMarker = L.marker([hLat, hLng], { icon: hospIcon, zIndexOffset: isSelected ? 850 : 700 });
          hospMarker.bindPopup(`
            <div style="font-family: sans-serif; padding: 4px; color: #f8fafc; min-width: 170px;">
              <strong style="color: #38bdf8; font-size: 12px;">🏥 ${hosp.name || 'Hospital'}</strong>
              <p style="margin: 2px 0 0; font-size: 10px; color: #cbd5e1;">${hosp.capability || 'Emergency Care'}</p>
              <div style="margin-top: 4px; font-size: 10px; color: #10b981; font-weight: 700;">
                Distance: ${hosp.distanceKm || 2.4} km &bull; ETA: ~${hosp.etaMin || 5} min
              </div>
            </div>
          `);

          hospMarker.on('click', () => {
            if (onSelectHospitalRef.current) onSelectHospitalRef.current(hosp);
          });

          layerGroupsRef.current.hospitals.addLayer(hospMarker);
        });
      } else if (selectedHospital) {
        const hLat = Number(selectedHospital.latitude || selectedHospital.coords?.[0]);
        const hLng = Number(selectedHospital.longitude || selectedHospital.coords?.[1]);
        if (hLat && hLng) {
          const destHtml = `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              gap: 4px;
              background: rgba(15, 23, 42, 0.95);
              border: 2px solid #38bdf8;
              border-radius: 6px;
              padding: 3px 6px;
              color: #38bdf8;
              font-size: 10px;
              font-weight: 800;
              white-space: nowrap;
              transform: translate(-50%, -50%);
              box-shadow: 0 0 16px rgba(56, 189, 248, 0.8);
            ">
              <span>🏥</span>
              <span>${selectedHospital.name || 'Hospital'}</span>
              <span style="background: #0284c7; color: #fff; font-size: 8px; padding: 1px 4px; border-radius: 3px;">DESTINATION</span>
            </div>
          `;
          const destIcon = L.divIcon({
            className: 'custom-dest-hosp-marker',
            html: destHtml,
            iconSize: [0, 0],
          });
          const destMarker = L.marker([hLat, hLng], { icon: destIcon, zIndexOffset: 850 });
          layerGroupsRef.current.hospitals.addLayer(destMarker);
        }
      }
    } catch (e) {
      console.warn('[MapView] Hospital layer update error:', e);
    }
  }, [hospitals, selectedHospital, showHospitals]);

  // 4. UPDATE PICKUP MARKER (STATIC ONCE, IN-PLACE SETLATLNG IF CHANGED)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window?.L;
    if (!map || !L || !layerGroupsRef.current.markers) return;

    try {
      const pLat = Number(pickupCoords?.latitude) || 12.9716;
      const pLng = Number(pickupCoords?.longitude) || 77.5946;
      const safeAddress = String(pickupAddress || 'Emergency Pickup Point');

      if (markersRef.current.pickup) {
        markersRef.current.pickup.setLatLng([pLat, pLng]);
      } else {
        const pickupHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
            <div style="
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: rgba(239, 68, 68, 0.25);
              border: 1.5px solid rgba(239, 68, 68, 0.8);
              animation: pulse-ring 1.8s infinite ease-out;
            "></div>
            <div style="
              width: 34px;
              height: 34px;
              background: #dc2626;
              border: 2px solid #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              box-shadow: 0 0 16px rgba(239, 68, 68, 0.9);
              z-index: 2;
            ">
              📍
            </div>
            <div style="
              margin-top: 2px;
              background: #ef4444;
              border: 1px solid #ffffff;
              border-radius: 3px;
              padding: 1px 5px;
              font-size: 8px;
              font-weight: 900;
              color: #ffffff;
              white-space: nowrap;
            ">
              PICKUP POINT
            </div>
          </div>
        `;

        const pickupIcon = L.divIcon({
          className: 'custom-pickup-marker',
          html: pickupHtml,
          iconSize: [0, 0],
        });

        const pickupMarker = L.marker([pLat, pLng], { icon: pickupIcon, zIndexOffset: 950 });
        pickupMarker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; color: #f8fafc;">
            <strong style="color: #ef4444; font-size: 12px;">📍 Patient Pickup Point</strong>
            <p style="margin: 2px 0 0; font-size: 10px; color: #cbd5e1;">${safeAddress}</p>
          </div>
        `);
        layerGroupsRef.current.markers.addLayer(pickupMarker);
        markersRef.current.pickup = pickupMarker;
      }
    } catch (e) {
      console.warn('[MapView] Pickup marker update error:', e);
    }
  }, [pickupCoords?.latitude, pickupCoords?.longitude, pickupAddress]);

  // 5. UPDATE AMBULANCE POSITION (FAST IN-PLACE SETLATLNG ONLY — ZERO LAYER REBUILD)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window?.L;
    if (!map || !L || !layerGroupsRef.current.markers) return;

    try {
      const dLat = Number(driverCoords?.latitude) || 12.9352;
      const dLng = Number(driverCoords?.longitude) || 77.6245;
      const safeAmbulanceNumber = String(ambulanceNumber || 'KA-01-EA-1088');

      if (markersRef.current.ambulance) {
        // Fast in-place marker position update without remounting or redrawing
        markersRef.current.ambulance.setLatLng([dLat, dLng]);

        // Controlled Follow Mode: Only pan when ambulance approaches viewport edge
        if (followAmbulance && map._loaded) {
          const bounds = map.getBounds();
          if (bounds) {
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            const latSpan = ne.lat - sw.lat;
            const lngSpan = ne.lng - sw.lng;

            // Inner safe boundary box (20% padding inside screen)
            const innerBounds = L.latLngBounds(
              [sw.lat + latSpan * 0.20, sw.lng + lngSpan * 0.20],
              [ne.lat - latSpan * 0.20, ne.lng - lngSpan * 0.20]
            );

            if (!innerBounds.contains([dLat, dLng])) {
              map.panTo([dLat, dLng], { animate: true, duration: 0.6 });
            }
          }
        }
      } else {
        const ambulanceHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); cursor: pointer;">
            <div style="
              position: absolute;
              width: 46px;
              height: 46px;
              border-radius: 50%;
              background: rgba(37, 99, 235, 0.28);
              border: 1.5px solid rgba(56, 189, 248, 0.85);
              animation: pulse-ring 2s infinite ease-out;
            "></div>
            <div style="
              width: 38px;
              height: 38px;
              background: #1e40af;
              border: 2px solid #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              box-shadow: 0 0 18px rgba(37, 99, 235, 0.95);
              z-index: 2;
            ">
              🚑
            </div>
            <div style="
              margin-top: 2px;
              background: rgba(15, 23, 42, 0.95);
              border: 1px solid #38bdf8;
              border-radius: 4px;
              padding: 1px 5px;
              font-size: 8px;
              font-weight: 800;
              color: #f8fafc;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.6);
            ">
              ${safeAmbulanceNumber}
            </div>
          </div>
        `;

        const ambulanceIcon = L.divIcon({
          className: 'custom-ambulance-marker',
          html: ambulanceHtml,
          iconSize: [0, 0],
        });

        const ambulanceMarker = L.marker([dLat, dLng], { icon: ambulanceIcon, zIndexOffset: 1000 });

        ambulanceMarker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px 6px; color: #f8fafc; min-width: 140px; text-align: left;">
            <div style="font-weight: 800; font-size: 11px; color: #38bdf8; display: flex; align-items: center; gap: 4px;">
              <span>🚑</span> SAVIOUR AMBULANCE
            </div>
            <div style="font-size: 10px; color: #e2e8f0; margin-top: 4px;">
              Speed: <strong style="color: #10b981;">40 km/h</strong>
            </div>
            <div style="font-size: 10px; color: #cbd5e1; margin-top: 2px;">
              Status: <span style="color: #38bdf8; font-weight: 700;">EN ROUTE</span>
            </div>
          </div>
        `);

        // Double-click zoom handler
        ambulanceMarker.on('dblclick', (e) => {
          if (L.DomEvent) {
            L.DomEvent.stopPropagation(e);
          }
          if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
            const currentPos = ambulanceMarker.getLatLng();
            mapInstanceRef.current.flyTo(currentPos, 17, {
              animate: true,
              duration: 0.8,
            });
          }
          if (onAmbulanceDblClickRef.current) {
            onAmbulanceDblClickRef.current();
          }
        });

        layerGroupsRef.current.markers.addLayer(ambulanceMarker);
        markersRef.current.ambulance = ambulanceMarker;
      }
    } catch (e) {
      console.warn('[MapView] Ambulance marker position update error:', e);
    }
  }, [
    driverCoords?.latitude,
    driverCoords?.longitude,
    followAmbulance,
    ambulanceNumber,
  ]);

  // 6. UPDATE TRAFFIC SIGNALS (INCREMENTAL IN-PLACE UPDATES ONLY)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = window?.L;
    if (!map || !L || !layerGroupsRef.current.signals) return;

    try {
      const signalsList = Array.isArray(externalTrafficLights) ? externalTrafficLights : [];
      const currentSignalMarkers = markersRef.current.signals;
      const seenIds = new Set();

      signalsList.forEach((tl) => {
        if (!tl || !tl.id) return;
        seenIds.add(tl.id);

        const sLat = Number(tl.latitude || tl.coords?.[0]);
        const sLng = Number(tl.longitude || tl.coords?.[1]);
        if (!sLat || !sLng) return;

        const stateKey = `${tl.state || tl.status || 'red'}-${Boolean(tl.isPreempted)}-${Boolean(tl.isPassed)}`;
        const existingMarker = currentSignalMarkers[tl.id];
        const prevStateKey = signalStatesRef.current[tl.id];

        if (existingMarker) {
          // If state changed, update ONLY the icon in-place
          if (stateKey !== prevStateKey) {
            const updatedHtml = getTrafficSignalHtml(tl);
            const updatedIcon = L.divIcon({
              className: 'custom-vertical-traffic-signal',
              html: updatedHtml,
              iconSize: [0, 0],
            });
            existingMarker.setIcon(updatedIcon);
            existingMarker.setZIndexOffset(tl.isPreempted ? 920 : 800);
            signalStatesRef.current[tl.id] = stateKey;
          }
        } else {
          // Create marker once
          const tlHtml = getTrafficSignalHtml(tl);
          const tlIcon = L.divIcon({
            className: 'custom-vertical-traffic-signal',
            html: tlHtml,
            iconSize: [0, 0],
          });

          const tlMarker = L.marker([sLat, sLng], { icon: tlIcon, zIndexOffset: tl.isPreempted ? 920 : 800 });
          const junctionName = String(tl.name || tl.roadName || 'Traffic Junction');

          tlMarker.bindPopup(`
            <div style="font-family: sans-serif; padding: 4px 6px; color: #f8fafc; min-width: 170px;">
              <strong style="font-size: 11px; color: #f8fafc;">🚦 ${junctionName}</strong>
              <div style="font-size: 9px; color: #cbd5e1; margin-top: 3px;">
                State: <strong style="color: #10b981;">${tl.isPassed ? 'CLEARED' : tl.isPreempted ? 'PRIORITY GREEN' : tl.state || 'RED'}</strong>
              </div>
            </div>
          `);

          layerGroupsRef.current.signals.addLayer(tlMarker);
          currentSignalMarkers[tl.id] = tlMarker;
          signalStatesRef.current[tl.id] = stateKey;
        }
      });

      // Remove any signals no longer in the active list
      Object.keys(currentSignalMarkers).forEach((id) => {
        if (!seenIds.has(id)) {
          layerGroupsRef.current.signals.removeLayer(currentSignalMarkers[id]);
          delete currentSignalMarkers[id];
          delete signalStatesRef.current[id];
        }
      });
    } catch (e) {
      console.warn('[MapView] Traffic signal incremental update error:', e);
    }
  }, [externalTrafficLights]);

  // Zoom and Locate Controls
  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
      try {
        mapInstanceRef.current.zoomIn();
      } catch {}
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
      try {
        mapInstanceRef.current.zoomOut();
      } catch {}
    }
  }, []);

  const handleLocateAmbulance = useCallback(() => {
    const dLat = Number(driverCoords?.latitude) || 12.9352;
    const dLng = Number(driverCoords?.longitude) || 77.6245;
    if (mapInstanceRef.current && mapInstanceRef.current._loaded) {
      try {
        mapInstanceRef.current.flyTo([dLat, dLng], 17, {
          animate: true,
          duration: 0.8,
        });
      } catch {}
    }
    if (onToggleFollowRef.current) {
      onToggleFollowRef.current(true);
    }
  }, [driverCoords?.latitude, driverCoords?.longitude]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100%',
        backgroundColor: '#0f172a', // Clean slate fallback to seamlessly match map tiles
        overflow: 'hidden',
      }}
    >
      <div
        ref={mapContainerRef}
        id="saviour-navigation-map-container"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
        }}
      />

      {/* Unobtrusive Map Loading Indicator */}
      {tilesLoading && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 950,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '9999px',
            padding: '3px 12px',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          <Loader2 size={12} className="animate-spin" />
          <span>Syncing OpenStreetMap tiles...</span>
        </div>
      )}

      {/* Minimal & Professional Map Controls */}
      {showControls && (
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 900,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            alignItems: 'flex-end',
          }}
        >
          {/* Zoom Group */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In"
              style={{
                width: '34px',
                height: '32px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out"
              style={{
                width: '34px',
                height: '32px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Minus size={15} />
            </button>
          </div>

          {/* Locate Ambulance Button */}
          <button
            type="button"
            onClick={handleLocateAmbulance}
            title="Center on Ambulance"
            style={{
              width: '34px',
              height: '34px',
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Locate size={16} />
          </button>

          {/* Follow Toggle Button */}
          {onToggleFollow && (
            <button
              type="button"
              onClick={() => onToggleFollow(!followAmbulance)}
              title={followAmbulance ? 'Auto-Follow ON' : 'Auto-Follow OFF'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                backgroundColor: followAmbulance ? 'rgba(37, 99, 235, 0.95)' : 'rgba(15, 23, 42, 0.92)',
                borderRadius: '8px',
                border: followAmbulance ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: followAmbulance ? '0 0 12px rgba(56, 189, 248, 0.6)' : '0 4px 14px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Crosshair size={12} color={followAmbulance ? '#ffffff' : '#94a3b8'} />
              <span>{followAmbulance ? 'FOLLOWING' : 'FOLLOW'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
});

MapView.displayName = 'MapView';

export default MapView;
