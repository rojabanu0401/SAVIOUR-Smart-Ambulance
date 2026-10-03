import { useState, useEffect } from 'react';
import { locationService } from '../services/locationService';

/**
 * Custom Hook: useLocation
 * Tracks GPS location coordinates.
 */
export const useLocation = () => {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await locationService.getCurrentPosition();
      setCoords(position);
      return position;
    } catch (err) {
      setError(err.message || 'Failed to obtain location');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  return { coords, error, loading, refreshLocation };
};
