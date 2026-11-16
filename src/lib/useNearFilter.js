import { useState } from 'react';
import { useLocation } from '../context/LocationContext';

// State for "Sort by nearest" + radius. The origin comes from the shared LocationContext.
export function useNearFilter() {
  const { origin } = useLocation();
  const [sortNearest, setSortNearest] = useState(false);
  const [radius, setRadius] = useState('all');
  return { origin, sortNearest, setSortNearest, radius, setRadius };
}
