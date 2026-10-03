import { supabase } from '../config/supabase';

/**
 * Location Service
 * Placeholder functions for GPS geolocation and live ambulance tracking.
 */

export const locationService = {
  /**
   * Get user's current GPS position via browser Geolocation API
   */
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading,
            speed: position.coords.speed,
          });
        },
        (error) => {
          console.warn('[locationService] Geolocation error, using default placeholder:', error.message);
          // Default placeholder coords if denied in dev mode
          resolve({ latitude: 12.9716, longitude: 77.5946 });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },

  /**
   * Update live ambulance position in 'ambulance_locations'
   */
  async updateAmbulancePosition(ambulanceId, coords) {
    console.log('[locationService] updateAmbulancePosition:', ambulanceId, coords);
    return { success: true };
  },

  /**
   * Subscribe to live location updates for an ambulance
   */
  subscribeToAmbulanceLocation(ambulanceId, callback) {
    console.log('[locationService] subscribeToAmbulanceLocation:', ambulanceId);
    const channel = supabase
      .channel(`public:ambulance_locations:${ambulanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulance_locations',
          filter: `ambulance_id=eq.${ambulanceId}`,
        },
        (payload) => {
          if (callback) callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
