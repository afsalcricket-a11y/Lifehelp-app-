import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentPosition, geoErrorKey } from '../lib/geo';
import { useAuth } from './AuthContext';

const LocationContext = createContext(null);
const CITY_KEY = 'lifehelp-city';

function savedCity() {
  try {
    return JSON.parse(localStorage.getItem(CITY_KEY) || 'null');
  } catch {
    return null;
  }
}

// Keeps the user's current GPS position in memory only (never saved), a chosen fallback city,
// and the origin used for distance. Priority: GPS > chosen city > saved profile location.
export function LocationProvider({ children }) {
  const { profile } = useAuth();
  const [gps, setGps] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | locating | ok | geo.* error key
  const [city, setCityState] = useState(savedCity);
  const [cities, setCities] = useState(null);

  const locate = useCallback(async () => {
    setStatus('locating');
    try {
      const pos = await getCurrentPosition();
      setGps(pos);
      setStatus('ok');
      return pos;
    } catch (e) {
      setStatus(geoErrorKey(e));
      return null;
    }
  }, []);

  const clearGps = useCallback(() => {
    setGps(null);
    setStatus('idle');
  }, []);

  const loadCities = useCallback(async () => {
    if (cities || !supabase) return;
    const { data } = await supabase.from('city_coordinates').select('name,state,kind,latitude,longitude').order('name', { ascending: true });
    setCities(data || []);
  }, [cities]);

  const setCity = useCallback((row) => {
    setCityState(row);
    try {
      if (row) localStorage.setItem(CITY_KEY, JSON.stringify(row));
      else localStorage.removeItem(CITY_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const origin = useMemo(() => {
    if (gps) return { lat: gps.lat, lon: gps.lon, source: 'gps' };
    if (city) return { lat: city.latitude, lon: city.longitude, source: 'city', name: city.name };
    if (typeof profile?.latitude === 'number' && typeof profile?.longitude === 'number') {
      return { lat: profile.latitude, lon: profile.longitude, source: 'profile' };
    }
    return null;
  }, [gps, city, profile?.latitude, profile?.longitude]);

  const value = useMemo(
    () => ({ gps, status, origin, city, cities, locate, clearGps, loadCities, setCity }),
    [gps, status, origin, city, cities, locate, clearGps, loadCities, setCity]
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export const useLocation = () => useContext(LocationContext);
