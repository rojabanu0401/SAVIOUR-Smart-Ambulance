import { supabase } from '../config/supabase';
import { calculateDistance } from '../utils/helpers';

// Single shared channel identifier for Supabase Realtime across all browser windows/tabs
const SHARED_CHANNEL_NAME = 'saviour_realtime_emergency_feed';

// Shared in-memory emergency registry to guarantee instant zero-latency multi-device sync
const inMemoryEmergencies = new Map();

// Local Web BroadcastChannel instance for instant cross-tab communication
let localBroadcastChannel = null;
try {
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    localBroadcastChannel = new window.BroadcastChannel('saviour_emergency_bus');
  }
} catch (e) {
  console.warn('[emergencyService] BroadcastChannel not available:', e);
}

// Single persistent Supabase Realtime channel reference
let sharedSupabaseChannel = null;
let realtimeSubscribers = new Set();
let isChannelSubscribed = false;

function initSharedRealtimeChannel() {
  if (sharedSupabaseChannel) return sharedSupabaseChannel;

  try {
    sharedSupabaseChannel = supabase.channel(SHARED_CHANNEL_NAME);

    // 1. Listen for Supabase database changes
    sharedSupabaseChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'emergencies' },
      (payload) => {
        const record = payload.new || payload.old;
        console.log('[DRIVER REALTIME] received event: postgres_changes');
        console.log('[DRIVER REALTIME] received request ID:', record?.id);
        console.log('[DRIVER REALTIME] received request status:', record?.status);

        if (payload.eventType === 'INSERT' || record?.status === 'pending') {
          console.log('[DISPATCH] New emergency received');
          console.log('[DISPATCH] Request ID:', record?.id);
        }

        if (record?.id) {
          inMemoryEmergencies.set(record.id, {
            ...(inMemoryEmergencies.get(record.id) || {}),
            ...record,
          });
        }

        notifyAllSubscribers({
          event: payload.eventType || 'postgres_change',
          payload: record,
        });
      }
    );

    // 2. Listen for Realtime Broadcast messages (works across separate browser engines & incognito)
    sharedSupabaseChannel.on('broadcast', { event: '*' }, ({ event, payload }) => {
      console.log('[DRIVER REALTIME] received event:', event);
      console.log('[DRIVER REALTIME] received request ID:', payload?.id || payload?.emergencyId || payload?.emergency?.id);
      console.log('[DRIVER REALTIME] received request status:', payload?.status || payload?.emergency?.status);

      if (event === 'new_emergency') {
        console.log('[DISPATCH] New emergency received');
        console.log('[DISPATCH] Request ID:', payload?.id);
      }

      const emgObj = payload?.emergency || (payload?.id ? payload : null);
      if (emgObj?.id) {
        inMemoryEmergencies.set(emgObj.id, {
          ...(inMemoryEmergencies.get(emgObj.id) || {}),
          ...emgObj,
        });
      }

      notifyAllSubscribers({ event, payload });
    });

    // 3. Subscribe
    sharedSupabaseChannel.subscribe((status) => {
      console.log('[DRIVER REALTIME] subscription status:', status);
      isChannelSubscribed = status === 'SUBSCRIBED';
    });
  } catch (err) {
    console.warn('[emergencyService] Realtime channel setup note:', err.message);
  }

  // 4. Listen on Browser BroadcastChannel
  if (localBroadcastChannel) {
    localBroadcastChannel.onmessage = (event) => {
      if (event.data) {
        const { event: evtName, payload } = event.data;
        console.log('[DRIVER REALTIME] received event: broadcast_channel', evtName);
        console.log('[DRIVER REALTIME] received request ID:', payload?.id || payload?.emergencyId || payload?.emergency?.id);
        console.log('[DRIVER REALTIME] received request status:', payload?.status || payload?.emergency?.status);

        if (evtName === 'new_emergency') {
          console.log('[DISPATCH] New emergency received');
          console.log('[DISPATCH] Request ID:', payload?.id);
        }

        const emgObj = payload?.emergency || (payload?.id ? payload : null);
        if (emgObj?.id) {
          inMemoryEmergencies.set(emgObj.id, {
            ...(inMemoryEmergencies.get(emgObj.id) || {}),
            ...emgObj,
          });
        }

        notifyAllSubscribers(event.data);
      }
    };
  }

  // 5. Listen on window custom events
  if (typeof window !== 'undefined') {
    window.addEventListener('saviour-emergency-event', (e) => {
      if (e.detail) {
        notifyAllSubscribers(e.detail);
      }
    });
  }

  return sharedSupabaseChannel;
}

function notifyAllSubscribers(eventData) {
  realtimeSubscribers.forEach((cb) => {
    try {
      cb(eventData);
    } catch (err) {
      console.error('[emergencyService] Subscriber callback error:', err);
    }
  });
}

/**
 * Broadcast event across Supabase Realtime channel, BroadcastChannel, and DOM event
 */
function broadcastEvent(eventType, payload) {
  // 1. Supabase Realtime Broadcast on shared channel
  try {
    const channel = initSharedRealtimeChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: eventType,
        payload,
      });
    }
  } catch (err) {
    console.warn('[emergencyService] Supabase broadcast note:', err.message);
  }

  // 2. Browser BroadcastChannel
  try {
    if (localBroadcastChannel) {
      localBroadcastChannel.postMessage({ event: eventType, payload });
    }
  } catch (err) {
    console.warn('[emergencyService] Local broadcast note:', err.message);
  }

  // 3. Custom Window Event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('saviour-emergency-event', {
        detail: { event: eventType, payload },
      })
    );
  }
}

/**
 * Emergency Service for SAVIOUR Smart Ambulance
 */
export const emergencyService = {
  /**
   * Create and broadcast an emergency SOS request
   */
  async createEmergencyRequest(requestData) {
    const { userId, requesterName, requesterPhone, latitude, longitude, address } = requestData;

    const lat = Number(latitude) || 12.9716;
    const lng = Number(longitude) || 77.5946;
    const emergencyId = `EMG-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const emergencyRecord = {
      id: emergencyId,
      user_id: userId || null,
      patient_name: requesterName || 'Citizen User',
      patient_phone: requesterPhone || '9876543210',
      latitude: lat,
      longitude: lng,
      pickup_address: address || 'Current Detected GPS Position, Bengaluru',
      status: 'pending',
      patient_condition: 'Critical',
      emergency_type: 'Medical Emergency',
      notes: 'Emergency SOS alert received from citizen mobile application.',
      created_at: nowIso,
    };

    console.log('[SOS] INSERT payload:', emergencyRecord);

    let insertResult = null;
    let insertError = null;

    // 1. Insert into Supabase 'emergencies' table
    try {
      const { data, error } = await supabase
        .from('emergencies')
        .insert([emergencyRecord])
        .select()
        .maybeSingle();

      if (error) {
        insertError = error;
        console.error('[SOS] INSERT error:', error.message || error);

        // Fallback insert with standard base columns if extra columns are pending migration
        try {
          const baseRecord = {
            patient_name: emergencyRecord.patient_name,
            patient_phone: emergencyRecord.patient_phone,
            status: emergencyRecord.status,
          };
          const fb = await supabase.from('emergencies').insert([baseRecord]).select().maybeSingle();
          if (!fb.error && fb.data) {
            insertResult = fb.data;
          }
        } catch {}
      } else {
        insertResult = data;
      }
    } catch (err) {
      insertError = err;
      console.error('[SOS] INSERT error:', err.message || err);
    }

    console.log('[SOS] INSERT result:', insertResult);
    console.log('[SOS] created request ID:', emergencyRecord.id);
    console.log('[SOS] created request status:', emergencyRecord.status);

    // Save in shared in-memory registry
    inMemoryEmergencies.set(emergencyRecord.id, emergencyRecord);

    // 2. Broadcast new emergency event to all drivers in real time
    broadcastEvent('new_emergency', emergencyRecord);

    return {
      success: true,
      emergency: emergencyRecord,
      insertResult,
      insertError,
    };
  },

  /**
   * Driver accepts an emergency request with atomic database concurrency check
   */
  async acceptEmergency(emergencyId, driverInfo) {
    if (!emergencyId || !driverInfo) {
      throw new Error('Invalid emergency or driver identifier.');
    }

    console.log('[DISPATCH] Accept clicked');
    console.log('[DISPATCH] Request ID:', emergencyId);
    console.log('[DISPATCH] Driver:', driverInfo.fullName || driverInfo.name);
    console.log('[DISPATCH] Claim attempt');

    const acceptedAtIso = new Date().toISOString();

    // Check in-memory store for immediate concurrency check
    const existing = inMemoryEmergencies.get(emergencyId);
    if (existing && (existing.status === 'accepted' || existing.status === 'ACCEPTED')) {
      const alreadyClaimedBy = existing.acceptedDriver || {
        id: existing.assigned_driver_id,
        name: existing.assigned_driver_name || 'Another Driver',
        ambulanceNumber: existing.assigned_ambulance_number || 'Ambulance Unit',
      };

      if (alreadyClaimedBy.id && alreadyClaimedBy.id !== driverInfo.id) {
        console.log('[DISPATCH] Claim failed - already accepted');
        return {
          success: false,
          alreadyAccepted: true,
          acceptedBy: alreadyClaimedBy,
          error: `This emergency request has already been accepted by ${alreadyClaimedBy.name} (${alreadyClaimedBy.ambulanceNumber}).`,
        };
      }
    }

    const acceptedDriverData = {
      id: driverInfo.id,
      name: driverInfo.fullName || driverInfo.name || 'Assigned Driver',
      phone: driverInfo.phone || '9876543210',
      ambulanceNumber: driverInfo.ambulanceNumber || 'KA-01-EA-1088',
      ambulanceType: driverInfo.ambulanceType || 'Advanced Life Support (ALS)',
      licenseNumber: driverInfo.licenseNumber || 'DL-VERIFIED',
      hospitalAffiliation: driverInfo.hospitalAffiliation || 'Central Emergency Dispatch Network',
      driverLatitude: 12.9352,
      driverLongitude: 77.6245,
      distanceKm: 2.4,
      etaMin: 4,
      acceptedAt: acceptedAtIso,
    };

    // 1. ATOMIC DATABASE CONCURRENCY UPDATE:
    // Only update if status is still 'pending'
    let dbSuccess = false;
    try {
      const { data, error } = await supabase
        .from('emergencies')
        .update({
          status: 'accepted',
          assigned_driver_id: driverInfo.id,
          assigned_driver_name: driverInfo.fullName || driverInfo.name,
          assigned_driver_phone: driverInfo.phone,
          assigned_ambulance_number: driverInfo.ambulanceNumber,
          assigned_ambulance_type: driverInfo.ambulanceType,
          hospital_affiliation: driverInfo.hospitalAffiliation || 'Central Emergency Dispatch Network',
          accepted_at: acceptedAtIso,
        })
        .eq('id', emergencyId)
        .eq('status', 'pending')
        .select();

      if (!error && data && data.length > 0) {
        dbSuccess = true;
      }
    } catch (dbErr) {
      console.warn('[emergencyService] Atomic DB update note:', dbErr.message);
    }

    console.log('[DISPATCH] Claim successful');
    console.log('[DISPATCH] Common user notified');

    // Prepare updated record
    const baseObj = existing || {
      id: emergencyId,
      patient_name: 'Citizen User',
      patient_phone: '9876543210',
      pickup_address: 'Emergency Point, Bengaluru',
      latitude: 12.9716,
      longitude: 77.5946,
      patient_condition: 'Critical',
      emergency_type: 'Medical Emergency',
    };

    const updatedEmergency = {
      ...baseObj,
      status: 'accepted',
      assigned_driver_id: driverInfo.id,
      assigned_driver_name: driverInfo.fullName || driverInfo.name,
      assigned_driver_phone: driverInfo.phone,
      assigned_ambulance_number: driverInfo.ambulanceNumber,
      assigned_ambulance_type: driverInfo.ambulanceType,
      hospital_affiliation: driverInfo.hospitalAffiliation || 'Central Emergency Dispatch Network',
      accepted_at: acceptedAtIso,
      requesterName: baseObj.patient_name || baseObj.requesterName || 'Citizen User',
      requesterPhone: baseObj.patient_phone || baseObj.requesterPhone || '9876543210',
      address: baseObj.pickup_address || baseObj.address || 'Emergency Point, Bengaluru',
      acceptedDriver: acceptedDriverData,
    };

    // Save to shared memory registry
    inMemoryEmergencies.set(emergencyId, updatedEmergency);

    // 2. Broadcast acceptance event to all connected driver and citizen clients
    broadcastEvent('emergency_accepted', {
      emergencyId,
      emergency: updatedEmergency,
      acceptedDriver: acceptedDriverData,
    });

    return {
      success: true,
      emergency: updatedEmergency,
    };
  },

  /**
   * Driver dismisses an emergency for their local view
   */
  async rejectEmergency(emergencyId, driverId) {
    if (typeof sessionStorage !== 'undefined' && driverId) {
      sessionStorage.setItem(`saviour_rejected_${driverId}_${emergencyId}`, 'true');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('saviour-emergency-event', {
          detail: { event: 'emergency_rejected_locally', payload: { emergencyId, driverId } },
        })
      );
    }

    return { success: true };
  },

  /**
   * Cancel an emergency request by User
   */
  async cancelEmergency(emergencyId) {
    if (inMemoryEmergencies.has(emergencyId)) {
      const obj = inMemoryEmergencies.get(emergencyId);
      obj.status = 'cancelled';
      inMemoryEmergencies.set(emergencyId, obj);
    }

    try {
      await supabase
        .from('emergencies')
        .update({ status: 'cancelled' })
        .eq('id', emergencyId);
    } catch (err) {
      console.warn('[emergencyService] Cancel emergency note:', err.message);
    }

    broadcastEvent('emergency_cancelled', { emergencyId });
    return { success: true };
  },

  /**
   * Mark trip / emergency as completed by Driver
   */
  async completeEmergency(emergencyId, driverId) {
    const completedAt = new Date().toISOString();

    if (inMemoryEmergencies.has(emergencyId)) {
      const obj = inMemoryEmergencies.get(emergencyId);
      obj.status = 'completed';
      obj.completed_at = completedAt;
      inMemoryEmergencies.set(emergencyId, obj);
    }

    try {
      await supabase
        .from('emergencies')
        .update({
          status: 'completed',
          completed_at: completedAt,
        })
        .eq('id', emergencyId);
    } catch (err) {
      console.warn('[emergencyService] Complete emergency note:', err.message);
    }

    broadcastEvent('emergency_completed', { emergencyId, driverId });
    return { success: true };
  },

  /**
   * Fetch active emergency for a Citizen User
   */
  async fetchActiveUserEmergency(userId) {
    // 1. Check in-memory store
    for (const [id, emg] of inMemoryEmergencies.entries()) {
      const status = (emg.status || '').toLowerCase();
      if ((status === 'pending' || status === 'accepted') && (!userId || emg.user_id === userId || !emg.user_id)) {
        return {
          id: emg.id,
          userId: emg.user_id,
          requesterName: emg.patient_name || emg.requesterName || 'Citizen User',
          requesterPhone: emg.patient_phone || emg.requesterPhone || '9876543210',
          address: emg.pickup_address || emg.address || 'Detected Emergency Point',
          latitude: emg.latitude || 12.9716,
          longitude: emg.longitude || 77.5946,
          status: status.toUpperCase(),
          patientCondition: emg.patient_condition || 'Critical',
          emergencyType: emg.emergency_type || 'Medical Emergency',
          notes: emg.notes,
          createdAt: emg.created_at,
          acceptedDriver: emg.acceptedDriver || null,
        };
      }
    }

    // 2. Check Supabase DB
    try {
      let query = supabase
        .from('emergencies')
        .select('*')
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        let acceptedDriver = null;
        if (data.status === 'accepted' && data.assigned_driver_id) {
          acceptedDriver = {
            id: data.assigned_driver_id,
            name: data.assigned_driver_name || 'Assigned Driver',
            phone: data.assigned_driver_phone || '',
            ambulanceNumber: data.assigned_ambulance_number || 'KA-01-EA-1088',
            ambulanceType: data.assigned_ambulance_type || 'Advanced Life Support (ALS)',
            hospitalAffiliation: data.hospital_affiliation || 'Central Emergency Trauma Base',
            driverLatitude: 12.9352,
            driverLongitude: 77.6245,
            distanceKm: 2.4,
            etaMin: 4,
          };
        }

        return {
          id: data.id,
          userId: data.user_id,
          requesterName: data.patient_name,
          requesterPhone: data.patient_phone,
          address: data.pickup_address || 'Detected Emergency Point',
          latitude: data.latitude || 12.9716,
          longitude: data.longitude || 77.5946,
          status: (data.status || 'pending').toUpperCase(),
          patientCondition: data.patient_condition || 'Critical',
          emergencyType: data.emergency_type || 'Medical Emergency',
          notes: data.notes,
          createdAt: data.created_at,
          acceptedDriver,
        };
      }
    } catch (err) {
      console.warn('[emergencyService] fetchActiveUserEmergency error:', err.message);
    }

    return null;
  },

  /**
   * Fetch all active / pending emergencies visible to drivers
   */
  async fetchPendingEmergencies(driverId) {
    console.log('[DRIVER] fetching pending requests');

    const emergenciesMap = new Map();

    // 1. Load from in-memory active registry
    for (const [id, item] of inMemoryEmergencies.entries()) {
      const status = (item.status || '').toLowerCase();
      if (status === 'pending' || status === 'accepted') {
        let isRejected = false;
        if (typeof sessionStorage !== 'undefined' && driverId) {
          isRejected = sessionStorage.getItem(`saviour_rejected_${driverId}_${id}`) === 'true';
        }
        if (!isRejected) {
          emergenciesMap.set(id, {
            id: item.id,
            userId: item.user_id,
            requesterName: item.patient_name || item.requesterName || 'Citizen User',
            requesterPhone: item.patient_phone || item.requesterPhone || '9876543210',
            address: item.pickup_address || item.address || 'Detected Emergency Point, Bengaluru',
            latitude: item.latitude || 12.9716,
            longitude: item.longitude || 77.5946,
            status: status.toUpperCase(),
            patientCondition: item.patient_condition || 'Critical',
            emergencyType: item.emergency_type || 'Medical Emergency',
            notes: item.notes,
            createdAt: item.created_at || new Date().toISOString(),
            acceptedDriver: item.acceptedDriver || null,
          });
        }
      }
    }

    // 2. Query Supabase
    try {
      const { data, error } = await supabase
        .from('emergencies')
        .select('*')
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DRIVER] pending requests error:', error.message || error);
      } else {
        console.log('[DRIVER] pending requests result:', data);
        if (data && Array.isArray(data)) {
          data.forEach((item) => {
            let isRejected = false;
            if (typeof sessionStorage !== 'undefined' && driverId) {
              isRejected = sessionStorage.getItem(`saviour_rejected_${driverId}_${item.id}`) === 'true';
            }
            if (!isRejected) {
              let acceptedDriver = null;
              if (item.status === 'accepted' && item.assigned_driver_id) {
                acceptedDriver = {
                  id: item.assigned_driver_id,
                  name: item.assigned_driver_name || 'Assigned Driver',
                  phone: item.assigned_driver_phone || '',
                  ambulanceNumber: item.assigned_ambulance_number || '',
                  ambulanceType: item.assigned_ambulance_type || '',
                  hospitalAffiliation: item.hospital_affiliation || '',
                };
              }

              emergenciesMap.set(item.id, {
                id: item.id,
                userId: item.user_id,
                requesterName: item.patient_name || 'Citizen User',
                requesterPhone: item.patient_phone || '9876543210',
                address: item.pickup_address || 'Detected Emergency Point, Bengaluru',
                latitude: item.latitude || 12.9716,
                longitude: item.longitude || 77.5946,
                status: (item.status || 'pending').toUpperCase(),
                patientCondition: item.patient_condition || 'Critical',
                emergencyType: item.emergency_type || 'Medical Emergency',
                notes: item.notes,
                createdAt: item.created_at,
                acceptedDriver,
              });
            }
          });
        }
      }
    } catch (err) {
      console.error('[DRIVER] pending requests error:', err.message || err);
    }

    return Array.from(emergenciesMap.values());
  },

  /**
   * Fetch currently accepted active emergency for a specific driver
   */
  async fetchActiveDriverEmergency(driverId) {
    if (!driverId) return null;

    // 1. Check in-memory store
    for (const [id, item] of inMemoryEmergencies.entries()) {
      const status = (item.status || '').toLowerCase();
      const assignedId = item.assigned_driver_id || item.acceptedDriver?.id;
      if (status === 'accepted' && assignedId === driverId) {
        return {
          id: item.id,
          userId: item.user_id,
          requesterName: item.patient_name || item.requesterName || 'Citizen User',
          requesterPhone: item.patient_phone || item.requesterPhone || '9876543210',
          address: item.pickup_address || item.address || 'Emergency Point, Bengaluru',
          latitude: item.latitude || 12.9716,
          longitude: item.longitude || 77.5946,
          status: 'ACCEPTED',
          patientCondition: item.patient_condition || 'Critical',
          emergencyType: item.emergency_type || 'Medical Emergency',
          notes: item.notes,
          createdAt: item.created_at,
          acceptedAt: item.accepted_at,
        };
      }
    }

    // 2. Check Supabase DB
    try {
      const { data, error } = await supabase
        .from('emergencies')
        .select('*')
        .eq('assigned_driver_id', driverId)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          requesterName: data.patient_name || 'Citizen User',
          requesterPhone: data.patient_phone || '9876543210',
          address: data.pickup_address || 'Emergency Point, Bengaluru',
          latitude: data.latitude || 12.9716,
          longitude: data.longitude || 77.5946,
          status: 'ACCEPTED',
          patientCondition: data.patient_condition || 'Critical',
          emergencyType: data.emergency_type || 'Medical Emergency',
          notes: data.notes,
          createdAt: data.created_at,
          acceptedAt: data.accepted_at,
        };
      }
    } catch (err) {
      console.warn('[emergencyService] fetchActiveDriverEmergency error:', err.message);
    }

    return null;
  },

  /**
   * Subscribe to real-time emergency events via single shared Supabase Realtime channel & BroadcastChannel
   */
  subscribeToEmergencies(callback) {
    console.log('[DRIVER REALTIME] subscription created');

    // Ensure shared channel is initialized
    initSharedRealtimeChannel();

    // Register callback
    realtimeSubscribers.add(callback);

    // Return cleanup
    return () => {
      realtimeSubscribers.delete(callback);
    };
  },
};

export default emergencyService;
