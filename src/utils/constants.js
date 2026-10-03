/**
 * Application Constants
 */

export const USER_ROLES = {
  COMMON_USER: 'common_user',
  DRIVER: 'driver',
  ADMIN: 'admin',
};

export const ROUTES = {
  HOME: '/',
  COMMON_LOGIN: '/common/login',
  COMMON_DASHBOARD: '/common/dashboard',
  DRIVER_LOGIN: '/driver/login',
  DRIVER_VERIFICATION: '/driver/verification',
  DRIVER_DASHBOARD: '/driver/dashboard',
};

export const EMERGENCY_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EN_ROUTE: 'en_route',
  ARRIVED: 'arrived',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const DRIVER_STATUS = {
  OFFLINE: 'offline',
  AVAILABLE: 'available',
  BUSY: 'busy',
  ON_EMERGENCY: 'on_emergency',
};

export const TRAFFIC_SIGNAL_STATUS = {
  NORMAL: 'normal',
  PRIORITY_REQUESTED: 'priority_requested',
  GREEN_OVERRIDE: 'green_override',
};

export const AMBULANCE_TYPES = [
  { value: 'Advanced Life Support (ALS)', label: 'Advanced Life Support (ALS)' },
  { value: 'Basic Life Support (BLS)', label: 'Basic Life Support (BLS)' },
  { value: 'Patient Transport Vehicle (PTV)', label: 'Patient Transport Vehicle (PTV)' },
  { value: 'Neonatal / Pediatric ICU Ambulance', label: 'Neonatal / Pediatric ICU Ambulance' },
];

