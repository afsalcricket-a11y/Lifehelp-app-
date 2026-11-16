export const TN_CENTER = [11.1271, 78.6569]; // default map view (Tamil Nadu)
export const RADIUS_OPTIONS = [5, 10, 25]; // km (plus "all")

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

// ~1 km precision. Used before anything is sent to or saved in the database.
export const roundCoord = (n) => Math.round(n * 100) / 100;
// ~100 m precision for the temporary search origin sent to the donor search function.
export const roundOrigin = (n) => Math.round(n * 1000) / 1000;

export function hasCoords(row) {
  return row && typeof row.latitude === 'number' && typeof row.longitude === 'number';
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject({ code: 'unsupported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject({ code: err.code }),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    );
  });
}

export function geoErrorKey(err) {
  if (err?.code === 'unsupported') return 'geo.unsupported';
  if (err?.code === 1) return 'geo.denied';
  if (err?.code === 3) return 'geo.timeout';
  return 'geo.unavailable';
}

// Adds distanceKm to each row (null when the row or the origin has no coordinates).
export function withDistance(rows, origin) {
  return rows.map((r) => ({
    ...r,
    distanceKm: origin && hasCoords(r) ? haversineKm(origin.lat, origin.lon, r.latitude, r.longitude) : null,
  }));
}

// Applies "sort nearest" and the radius filter to rows that already have distanceKm.
export function applyNearFilter(rows, { origin, sortNearest, radius }) {
  let out = rows;
  if (origin && radius !== 'all') out = out.filter((r) => r.distanceKm != null && r.distanceKm <= Number(radius));
  if (origin && sortNearest) {
    out = [...out].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }
  return out;
}
