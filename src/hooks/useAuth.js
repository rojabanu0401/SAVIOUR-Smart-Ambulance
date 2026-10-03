import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { authService } from '../services/authService';
import { driverService } from '../services/driverService';

/**
 * Custom Hook: useAuth
 * Session & Identity manager for Common Users and Ambulance Drivers
 * Ensures complete multi-driver session isolation across tabs and windows
 */
export const useAuth = () => {
  const [commonUser, setCommonUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize active authenticated user identity for this tab/window
  const refreshSessionIdentity = useCallback(async () => {
    try {
      // 1. Check if driver session is active in this tab/window
      const currentDriver = await driverService.fetchCurrentSessionDriver();
      if (currentDriver) {
        setDriver(currentDriver);
        setCommonUser(null);
        return;
      }

      // 2. Check if common user session is active in this tab/window
      const currentUser = await authService.fetchCurrentSessionUser();
      if (currentUser) {
        setCommonUser(currentUser);
        setDriver(null);
        return;
      }

      setCommonUser(null);
      setDriver(null);
    } catch (err) {
      console.warn('[useAuth] Error refreshing session identity:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSessionIdentity();

    // Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[useAuth] Supabase onAuthStateChange: ${event}`);
      if (event === 'SIGNED_OUT' || !session) {
        await refreshSessionIdentity();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await refreshSessionIdentity();
      }
    });

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [refreshSessionIdentity]);

  // Common User login
  const loginCommon = async (phoneNumber, name) => {
    setLoading(true);
    try {
      const result = await authService.loginCommonUser(phoneNumber, name);
      await refreshSessionIdentity();
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Common User logout
  const logoutCommon = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setCommonUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Driver phone check
  const checkDriverPhone = async (phoneNumber) => {
    setLoading(true);
    try {
      return await driverService.checkDriverRegistration(phoneNumber);
    } finally {
      setLoading(false);
    }
  };

  // Driver login existing
  const loginDriver = async (driverRecord) => {
    setLoading(true);
    try {
      const result = await driverService.loginExistingDriver(driverRecord);
      await refreshSessionIdentity();
      return result?.driver || result;
    } finally {
      setLoading(false);
    }
  };

  // Driver verification & registration
  const registerDriver = async (driverDetails) => {
    setLoading(true);
    try {
      const result = await driverService.registerVerifiedDriver(driverDetails);
      await refreshSessionIdentity();
      return result?.driver || result;
    } finally {
      setLoading(false);
    }
  };

  // Driver online status toggle
  const updateDriverStatus = async (isOnline) => {
    if (!driver?.id) return null;
    const result = await driverService.updateDriverStatus(driver.id, isOnline);
    setDriver((prev) => (prev ? { ...prev, isOnline: Boolean(isOnline), status: isOnline ? 'available' : 'offline' } : null));
    return result;
  };

  // Driver logout
  const logoutDriver = async () => {
    setLoading(true);
    try {
      await driverService.logoutDriver();
      setDriver(null);
    } finally {
      setLoading(false);
    }
  };

  const activeRole = driver ? 'driver' : commonUser ? 'common_user' : null;

  return {
    commonUser,
    driver,
    activeRole,
    loading,
    loginCommon,
    logoutCommon,
    checkDriverPhone,
    loginDriver,
    registerDriver,
    updateDriverStatus,
    logoutDriver,
    refreshSessionIdentity,
  };
};

export default useAuth;
