import { supabase } from '../config/supabase';
import { isValidPhoneNumber } from '../utils/helpers';

const COMMON_USER_SESSION_KEY = 'saviour_common_session';

// Sample demo users for quick 1-click testing
export const DEMO_COMMON_USERS = [
  {
    name: 'Aarav Patel',
    phone: '9876543210',
    emergencyContact: '9876543211',
    bloodGroup: 'O+',
    address: 'Indiranagar 100ft Rd, Bengaluru',
  },
  {
    name: 'Sneha Rao',
    phone: '9123456780',
    emergencyContact: '9123456781',
    bloodGroup: 'B+',
    address: 'Koramangala 4th Block, Bengaluru',
  },
];

export function getCitizenUUID(phone) {
  const cleanPhone = (phone || '').replace(/\D/g, '').padStart(12, '0').slice(-12);
  return `10000000-0000-4000-a000-${cleanPhone}`;
}

function getAuthEmailForCitizen(phone) {
  return `citizen_${phone}@saviour.internal`;
}

function getAuthPasswordForCitizen(phone) {
  return `Saviour#citizen#${phone}#2026`;
}

/**
 * Common User Authentication Service
 */
export const authService = {
  /**
   * Log in Common User with mobile number and optional name
   */
  async loginCommonUser(phoneNumber, name = 'Citizen') {
    const cleanPhone = (phoneNumber || '').replace(/\D/g, '');

    if (!isValidPhoneNumber(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    let citizenUserId = getCitizenUUID(cleanPhone);
    const email = getAuthEmailForCitizen(cleanPhone);
    const password = getAuthPasswordForCitizen(cleanPhone);

    // 1. Attempt Supabase Auth Sign In silently
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError && signInData?.user) {
        citizenUserId = signInData.user.id;
      }
    } catch {
      // Graceful fallback to citizen deterministic UUID
    }

    const userRecord = {
      id: citizenUserId,
      phone: cleanPhone,
      name: name || 'Citizen User',
      role: 'common_user',
      loggedInAt: new Date().toISOString(),
    };

    // 2. Persist to tab-scoped sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(COMMON_USER_SESSION_KEY, JSON.stringify(userRecord));
    }

    // 3. Upsert to Supabase 'profiles' table
    try {
      await supabase.from('profiles').upsert([
        {
          id: citizenUserId,
          phone: cleanPhone,
          full_name: userRecord.name,
          role: 'common_user',
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.warn('[authService] Supabase profile upsert note:', err.message);
    }

    return {
      success: true,
      user: userRecord,
    };
  },

  /**
   * Fetch current authenticated common user from session
   */
  async fetchCurrentSessionUser() {
    let sessionUser = null;

    // 1. Check window/tab sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(COMMON_USER_SESSION_KEY);
      if (raw) {
        try {
          sessionUser = JSON.parse(raw);
        } catch {}
      }
    }

    // 2. Check Supabase Auth session if available
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.user_metadata?.role === 'common_user') {
        const userId = session.user.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          sessionUser = {
            id: userId,
            phone: profile.phone || session.user.user_metadata?.phone || sessionUser?.phone || '',
            name: profile.full_name || session.user.user_metadata?.full_name || sessionUser?.name || 'Citizen',
            role: 'common_user',
          };
        }
      }
    } catch {}

    return sessionUser;
  },

  /**
   * Sign out Common User session
   */
  async signOut() {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(COMMON_USER_SESSION_KEY);
    }
    try {
      await supabase.auth.signOut();
    } catch {}
    return true;
  },

  /**
   * Get demo credentials
   */
  getDemoUsers() {
    return DEMO_COMMON_USERS;
  },
};

export default authService;
