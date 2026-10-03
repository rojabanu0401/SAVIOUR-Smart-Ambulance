import { useState, useEffect, useCallback } from 'react';
import { emergencyService } from '../services/emergencyService';
import { useAuth } from './useAuth';

/**
 * Custom Hook: useEmergency
 * Supabase Realtime-backed emergency lifecycle manager for Common Users and Ambulance Drivers
 */
export const useEmergency = () => {
  const { commonUser, driver } = useAuth();

  // User State
  const [userEmergency, setUserEmergency] = useState(null);

  // Driver State
  const [incomingEmergencies, setIncomingEmergencies] = useState([]);
  const [driverActiveEmergency, setDriverActiveEmergency] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Synchronize state from Supabase database
  const syncState = useCallback(async () => {
    try {
      if (commonUser?.id) {
        const userEmg = await emergencyService.fetchActiveUserEmergency(commonUser.id);
        setUserEmergency(userEmg);
      } else {
        setUserEmergency(null);
      }

      if (driver?.id) {
        const pending = await emergencyService.fetchPendingEmergencies(driver.id);
        setIncomingEmergencies(pending);

        const activeForDriver = await emergencyService.fetchActiveDriverEmergency(driver.id);
        setDriverActiveEmergency(activeForDriver);
      } else {
        setIncomingEmergencies([]);
        setDriverActiveEmergency(null);
      }
    } catch (err) {
      console.warn('[useEmergency] syncState note:', err);
    }
  }, [commonUser?.id, driver?.id]);

  useEffect(() => {
    syncState();

    // Subscribe to real-time events across Supabase and BroadcastChannel
    const unsubscribe = emergencyService.subscribeToEmergencies((eventData) => {
      console.log('[useEmergency] Real-time synchronization triggered:', eventData);
      syncState();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [syncState]);

  // Common User: Trigger SOS
  const triggerSOS = async (locationData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        userId: commonUser?.id || null,
        requesterName: commonUser?.name || 'Citizen User',
        requesterPhone: commonUser?.phone || '9876543210',
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
      };

      const result = await emergencyService.createEmergencyRequest(payload);
      setUserEmergency(result.emergency);
      await syncState();
      return result;
    } catch (err) {
      setError(err.message || 'Failed to dispatch SOS request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Common User: Cancel SOS
  const cancelSOS = async (emergencyId) => {
    setLoading(true);
    try {
      const emgId = emergencyId || userEmergency?.id;
      if (emgId) {
        await emergencyService.cancelEmergency(emgId);
        setUserEmergency(null);
        await syncState();
      }
    } finally {
      setLoading(false);
    }
  };

  // Driver: Accept Request
  const acceptRequest = async (emergencyId) => {
    if (!driver?.id) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await emergencyService.acceptEmergency(emergencyId, driver);
      if (result.success) {
        setDriverActiveEmergency(result.emergency);
      } else {
        setError(result.error);
      }
      await syncState();
      return result;
    } catch (err) {
      setError(err.message || 'Failed to accept emergency request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Driver: Reject Request
  const rejectRequest = async (emergencyId) => {
    if (!driver?.id) return;
    try {
      await emergencyService.rejectEmergency(emergencyId, driver.id);
      await syncState();
    } catch (err) {
      console.error('[useEmergency] Reject error:', err);
    }
  };

  // Driver: Complete Trip
  const completeTrip = async (emergencyId) => {
    setLoading(true);
    try {
      const emgId = emergencyId || driverActiveEmergency?.id;
      if (emgId) {
        await emergencyService.completeEmergency(emgId, driver?.id);
        setDriverActiveEmergency(null);
        await syncState();
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    // User props
    userEmergency,
    triggerSOS,
    cancelSOS,

    // Driver props
    incomingEmergencies,
    driverActiveEmergency,
    acceptRequest,
    rejectRequest,
    completeTrip,

    // Shared
    loading,
    error,
    refreshState: syncState,
  };
};

export default useEmergency;
