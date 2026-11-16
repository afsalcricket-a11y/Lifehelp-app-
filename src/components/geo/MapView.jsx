import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TN_CENTER } from '../../lib/geo';

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * markers: [{ id, lat, lon, label, color, title }]
 * Clicking a pin calls onSelect(id). The page shows the details of the selected item under the map.
 * Tiles come from OpenStreetMap (free, no API key).
 */
export default function MapView({ markers, selectedId, onSelect, origin, youLabel = 'You', className = '' }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const pinLayerRef = useRef(null);
  const youLayerRef = useRef(null);

  // create the map once
  useEffect(() => {
    const map = L.map(elRef.current, { center: TN_CENTER, zoom: 7, zoomControl: true, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    pinLayerRef.current = L.layerGroup().addTo(map);
    youLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const fix = setTimeout(() => map.invalidateSize(), 150);
    return () => {
      clearTimeout(fix);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // draw pins (and highlight the selected one)
  useEffect(() => {
    const layer = pinLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markers.forEach((m) => {
      const selected = m.id === selectedId;
      const icon = L.divIcon({
        className: 'lh-pin',
        html: `<div class="lh-pin-body${selected ? ' lh-pin-selected' : ''}" style="--pin:${escapeHtml(m.color || '#e11d48')}">${escapeHtml(m.label)}</div>`,
        iconSize: [46, 44],
        iconAnchor: [23, 44],
      });
      L.marker([m.lat, m.lon], { icon, title: m.title || '', keyboard: true, zIndexOffset: selected ? 1000 : 0 })
        .on('click', () => onSelect?.(m.id))
        .addTo(layer);
    });
  }, [markers, selectedId, onSelect]);

  // "you are here" dot
  useEffect(() => {
    const layer = youLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (origin) {
      L.circleMarker([origin.lat, origin.lon], { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 })
        .bindTooltip(youLabel)
        .addTo(layer);
    }
  }, [origin, youLabel]);

  // fit the view when the set of pins (or the origin) changes, not when a pin is selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pts = markers.map((m) => [m.lat, m.lon]);
    if (origin) pts.push([origin.lat, origin.lon]);
    if (pts.length === 1) map.setView(pts[0], 13);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, origin?.lat, origin?.lon]);

  return <div ref={elRef} className={`relative isolate z-0 h-[340px] w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 ${className}`} />;
}
