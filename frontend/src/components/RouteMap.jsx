import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',    import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png',  import.meta.url).href,
});

function makeDivIcon(bg, label, size = 36) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg};
      color:white;
      border-radius:50%;
      width:${size}px;
      height:${size}px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700;
      font-size:${size * 0.35}px;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      font-family:Inter,system-ui,sans-serif;
    ">${label}</div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

const WAYPOINT_CONFIG = {
  start:   { bg: '#22c55e', label: 'S' },
  pickup:  { bg: '#3b82f6', label: 'P' },
  dropoff: { bg: '#ef4444', label: 'D' },
};

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 1) {
      try {
        map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
      } catch (_) {}
    }
  }, [positions, map]);
  return null;
}

export default function RouteMap({ waypoints = [], routeGeometry }) {
  const center = waypoints[0]
    ? [waypoints[0].lat, waypoints[0].lon]
    : [39.5, -98.35];

  const routeCoords = useMemo(() => {
    if (!routeGeometry?.coordinates) return [];
    return routeGeometry.coordinates.map(([lon, lat]) => [lat, lon]);
  }, [routeGeometry]);

  const boundPositions = useMemo(() => {
    if (routeCoords.length > 0) return routeCoords;
    return waypoints.map((w) => [w.lat, w.lon]);
  }, [routeCoords, waypoints]);

  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      className="rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        noWrap={true}
      />

      <FitBounds positions={boundPositions} />

      {/* Route line */}
      {routeCoords.length > 0 && (
        <>
          {/* Shadow line */}
          <Polyline positions={routeCoords} color="#1e40af" weight={7} opacity={0.25} />
          {/* Main line */}
          <Polyline positions={routeCoords} color="#3b82f6" weight={4} opacity={0.9} />
        </>
      )}

      {/* Fallback straight lines */}
      {routeCoords.length === 0 && waypoints.length >= 2 && (
        <Polyline
          positions={waypoints.map((w) => [w.lat, w.lon])}
          color="#3b82f6"
          weight={3}
          dashArray="8 6"
          opacity={0.7}
        />
      )}

      {/* Waypoint markers */}
      {waypoints.map((wp, i) => {
        const cfg = WAYPOINT_CONFIG[wp.type] || { bg: '#64748b', label: i };
        return (
          <Marker
            key={i}
            position={[wp.lat, wp.lon]}
            icon={makeDivIcon(cfg.bg, cfg.label, 36)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold capitalize">{wp.type}</p>
                <p className="text-slate-600">{wp.name}</p>
                <p className="text-xs text-slate-400">
                  {wp.lat.toFixed(4)}, {wp.lon.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
