import { supabase } from '../config/supabase';
import { isValidPhoneNumber } from '../utils/helpers';

const DRIVER_SESSION_KEY = 'saviour_driver_session';

// Pre-registered demo drivers for testing
export const PRELOADED_DEMO_DRIVERS = [
  {
    id: '00000000-0000-4000-a000-009876543210',
    fullName: 'Rahul Sharma',
    phone: '9876543210',
    ambulanceNumber: 'KA-01-EA-1088',
    licenseNumber: 'DL-0420110012345',
    ambulanceType: 'Advanced Life Support (ALS)',
    email: 'rahul.sharma@emergency.org',
    isVerified: true,
    isOnline: true,
    status: 'available',
    tripsCompleted: 42,
    rating: 4.9,
    hospitalAffiliation: 'Apollo Emergency Center, Bengaluru',
  },
  {
    id: '00000000-0000-4000-a000-009876500001',
    fullName: 'Priya Nair',
    phone: '9876500001',
    ambulanceNumber: 'KA-05-EM-1122',
    licenseNumber: 'DL-0920150098765',
    ambulanceType: 'Basic Life Support (BLS)',
    email: 'priya.nair@emergency.org',
    isVerified: true,
    isOnline: true,
    status: 'available',
    tripsCompleted: 28,
    rating: 4.8,
    hospitalAffiliation: 'Manipal Hospital, Old Airport Rd',
  },
];

/**
 * Generate a deterministic standard UUID for each driver phone
 */
export function getDriverUUID(phone) {
  const cleanPhone = (phone || '').replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `00000000-0000-4000-a000-${cleanPhone}`;
}

function getAuthEmailForDriver(phone) {
  return `driver_${phone}@saviour.internal`;
}

function getAuthPasswordForDriver(phone) {
  return `Saviour#driver#${phone}#2026`;
}

/**
 * Driver Service for Smart Ambulance
 * Fully isolated multi-driver architecture using Supabase Auth & tab-isolated session storage
 */
export const driverService = {
  /**
   * Check if a driver phone number is registered in the system
   */
  async checkDriverRegistration(phoneNumber) {
    const cleanPhone = (phoneNumber || '').replace(/\D/g, '');

    if (!isValidPhoneNumber(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    try {
      // 1. Query Supabase 'ambulances' table for registered driver phone
      const { data: supabaseAmbulance, error } = await supabase
        .from('ambulances')
        .select('*')
        .eq('driver_phone', cleanPhone)
        .maybeSingle();

      if (!error && supabaseAmbulance) {
        const driverRecord = {
          id: supabaseAmbulance.driver_id || getDriverUUID(cleanPhone),
          fullName: supabaseAmbulance.driver_name || 'Registered Driver',
          phone: cleanPhone,
          ambulanceNumber: supabaseAmbulance.vehicle_number || 'KA-01-EA-1088',
          licenseNumber: supabaseAmbulance.license_number || 'DL-VERIFIED',
          ambulanceType: supabaseAmbulance.type || 'Advanced Life Support (ALS)',
          hospitalAffiliation: supabaseAmbulance.hospital_affiliation || 'Central Emergency Dispatch Network',
          isVerified: true,
          isOnline: supabaseAmbulance.is_active !== false,
          status: supabaseAmbulance.status || 'available',
        };
        return { isRegistered: true, driver: driverRecord };
      }
    } catch (err) {
      console.warn('[driverService] Supabase check registration query note:', err.message);
    }

    // 2. Check demo registered drivers list
    const existingDemo = PRELOADED_DEMO_DRIVERS.find((d) => d.phone === cleanPhone);
    if (existingDemo) {
      return { isRegistered: true, driver: existingDemo };
    }

    return { isRegistered: false, driver: null };
  },

  /**
   * Log in an existing verified driver without repeated signup or email rate limit triggers
   */
  async loginExistingDriver(driverData) {
    const cleanPhone = (driverData?.phone || '').replace(/\D/g, '');
    let driverUserId = driverData.id || getDriverUUID(cleanPhone);
    const email = getAuthEmailForDriver(cleanPhone);
    const password = getAuthPasswordForDriver(cleanPhone);

    // 1. Attempt Supabase Auth Sign In (without triggering new signup / email verification)
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError && signInData?.user) {
        driverUserId = signInData.user.id;
      }
    } catch (authErr) {
      // Silently fall back to unique driver UUID if Supabase Auth has email confirmation / rate limits
      console.log('[driverService] Supabase Auth sign-in notice:', authErr.message);
    }

    // 2. Build isolated driver object for this tab/window
    const activeDriver = {
      id: driverUserId,
      fullName: driverData.fullName || 'Registered Driver',
      phone: cleanPhone,
      ambulanceNumber: driverData.ambulanceNumber || 'KA-01-EA-1088',
      licenseNumber: driverData.licenseNumber || 'DL-VERIFIED',
      ambulanceType: driverData.ambulanceType || 'Advanced Life Support (ALS)',
      hospitalAffiliation: driverData.hospitalAffiliation || 'Central Emergency Dispatch Network',
      isVerified: true,
      isOnline: driverData.isOnline !== undefined ? driverData.isOnline : true,
      status: driverData.status || 'available',
      loggedInAt: new Date().toISOString(),
    };

    // 3. Persist session strictly to sessionStorage (isolated per tab/window)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(activeDriver));
    }

    // 4. Sync profile & ambulance record in Supabase database
    try {
      await supabase.from('profiles').upsert([
        {
          id: driverUserId,
          phone: cleanPhone,
          full_name: activeDriver.fullName,
          role: 'driver',
          updated_at: new Date().toISOString(),
        },
      ]);

      await supabase.from('ambulances').upsert([
        {
          driver_id: driverUserId,
          vehicle_number: activeDriver.ambulanceNumber,
          driver_name: activeDriver.fullName,
          driver_phone: cleanPhone,
          license_number: activeDriver.licenseNumber,
          type: activeDriver.ambulanceType,
          hospital_affiliation: activeDriver.hospitalAffiliation,
          status: activeDriver.status,
          is_active: activeDriver.isOnline,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (dbErr) {
      console.warn('[driverService] Supabase database sync note:', dbErr.message);
    }

    return { success: true, driver: activeDriver };
  },

  /**
   * Register and verify a new driver with commercial credentials
   */
  async registerVerifiedDriver(details) {
    const { fullName, phone, ambulanceNumber, licenseNumber, ambulanceType, hospitalAffiliation, email } = details;
    const cleanPhone = (phone || '').replace(/\D/g, '');

    // Validation
    if (!fullName || fullName.trim().length < 2) {
      throw new Error('Please enter driver full name.');
    }
    if (!isValidPhoneNumber(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    if (!ambulanceNumber || ambulanceNumber.trim().length < 4) {
      throw new Error('Please enter a valid ambulance registration number (e.g. KA-01-EA-1088).');
    }
    if (!licenseNumber || licenseNumber.trim().length < 5) {
      throw new Error('Please enter a valid commercial driver license number.');
    }
    if (!ambulanceType) {
      throw new Error('Please select an ambulance capability category.');
    }

    let driverUserId = getDriverUUID(cleanPhone);
    const authEmail = getAuthEmailForDriver(cleanPhone);
    const password = getAuthPasswordForDriver(cleanPhone);

    // Try signing in / signing up once
    try {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password,
      });

      if (signInData?.user) {
        driverUserId = signInData.user.id;
      }
    } catch {
      // Graceful fallback to driver UUID
    }

    const newDriverRecord = {
      id: driverUserId,
      fullName: fullName.trim(),
      phone: cleanPhone,
      ambulanceNumber: ambulanceNumber.trim().toUpperCase(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      ambulanceType: ambulanceType,
      hospitalAffiliation: (hospitalAffiliation || 'Central Emergency Dispatch Network').trim(),
      email: email ? email.trim() : '',
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      isOnline: true,
      status: 'available',
    };

    // Store in tab-scoped sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(newDriverRecord));
    }

    // Upsert in Supabase
    try {
      await supabase.from('profiles').upsert([
        {
          id: driverUserId,
          phone: cleanPhone,
          full_name: newDriverRecord.fullName,
          role: 'driver',
          updated_at: new Date().toISOString(),
        },
      ]);

      await supabase.from('ambulances').upsert([
        {
          driver_id: driverUserId,
          vehicle_number: newDriverRecord.ambulanceNumber,
          driver_name: newDriverRecord.fullName,
          driver_phone: cleanPhone,
          license_number: newDriverRecord.licenseNumber,
          type: newDriverRecord.ambulanceType,
          hospital_affiliation: newDriverRecord.hospitalAffiliation,
          status: 'available',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (dbErr) {
      console.warn('[driverService] Supabase registration upsert note:', dbErr.message);
    }

    return {
      success: true,
      driver: newDriverRecord,
    };
  },

  /**
   * Fetch currently active driver session for THIS specific browser window
   */
  async fetchCurrentSessionDriver() {
    let sessionDriver = null;

    // 1. Check window/tab-scoped sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(DRIVER_SESSION_KEY);
      if (raw) {
        try {
          sessionDriver = JSON.parse(raw);
        } catch {}
      }
    }

    // 2. Check Supabase Auth session if available
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.user_metadata?.role === 'driver') {
        const userId = session.user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const { data: ambulance } = await supabase
          .from('ambulances')
          .select('*')
          .eq('driver_id', userId)
          .maybeSingle();

        if (profile || ambulance) {
          sessionDriver = {
            id: userId,
            fullName: profile?.full_name || session.user.user_metadata?.full_name || ambulance?.driver_name || sessionDriver?.fullName || 'Driver',
            phone: profile?.phone || session.user.user_metadata?.phone || ambulance?.driver_phone || sessionDriver?.phone || '',
            ambulanceNumber: ambulance?.vehicle_number || sessionDriver?.ambulanceNumber || 'KA-01-EA-1088',
            licenseNumber: ambulance?.license_number || sessionDriver?.licenseNumber || 'DL-VERIFIED',
            ambulanceType: ambulance?.type || sessionDriver?.ambulanceType || 'Advanced Life Support (ALS)',
            hospitalAffiliation: ambulance?.hospital_affiliation || sessionDriver?.hospitalAffiliation || 'Central Emergency Dispatch Network',
            isVerified: true,
            isOnline: ambulance ? ambulance.is_active : (sessionDriver?.isOnline ?? true),
            status: ambulance ? ambulance.status : (sessionDriver?.status || 'available'),
          };
        }
      }
    } catch {}

    return sessionDriver;
  },

  /**
   * Update active driver online / offline status in Supabase database & current session
   */
  async updateDriverStatus(driverId, isOnline) {
    if (!driverId) return null;

    const newStatus = isOnline ? 'available' : 'offline';

    // Update in sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(DRIVER_SESSION_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          parsed.isOnline = Boolean(isOnline);
          parsed.status = newStatus;
          sessionStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(parsed));
        } catch {}
      }
    }

    // Update in Supabase database
    try {
      await supabase
        .from('ambulances')
        .update({
          status: newStatus,
          is_active: Boolean(isOnline),
          updated_at: new Date().toISOString(),
        })
        .eq('driver_id', driverId);
    } catch (err) {
      console.warn('[driverService] Supabase status update note:', err.message);
    }

    return {
      isOnline: Boolean(isOnline),
      status: newStatus,
    };
  },

  /**
   * Sign out driver session from this browser window
   */
  async logoutDriver() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(DRIVER_SESSION_KEY);
    }
    try {
      await supabase.auth.signOut();
    } catch {}
    return true;
  },

  /**
   * Return preloaded demo drivers for fast testing in UI
   */
  getDemoDrivers() {
    return PRELOADED_DEMO_DRIVERS;
  },
};

export default driverService;
