import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { clusterPoints, decimate, simplifyPath } from "@/lib/map/optimize";

export interface MapPoint {
  label: string;
  lat: number;
  lng: number;
  kind: "pickup" | "partner" | "mandi" | "driver";
  detail?: string;
}

const COLORS: Record<MapPoint["kind"], string> = {
  pickup: "#1B4332",
  partner: "#2D6A4F",
  mandi: "#E9C46A",
  driver: "#B23A48",
};

/** Icons are expensive to build; reuse one per (kind, size, count). */
const iconCache = new Map<string, L.DivIcon>();

function pin(kind: MapPoint["kind"], count: number) {
  const size = count > 1 ? 34 : kind === "mandi" ? 30 : 24;
  const key = `${kind}:${size}:${count}`;
  const cached = iconCache.get(key);
  if (cached) return cached;
  const inner =
    count > 1
      ? `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${COLORS[kind]};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35);color:#fff;font:600 12px/1 system-ui">${count}</span>`
      : `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${COLORS[kind]};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35)"></span>`;
  const icon = L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: inner,
  });
  iconCache.set(key, icon);
  return icon;
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  // Only refit when the geographic envelope actually changes, not on every tick.
  const signature = useMemo(
    () =>
      points.length === 0
        ? ""
        : points
            .reduce<[number, number, number, number]>(
              (acc, p) => [
                Math.min(acc[0], p.lat),
                Math.min(acc[1], p.lng),
                Math.max(acc[2], p.lat),
                Math.max(acc[3], p.lng),
              ],
              [90, 180, -90, -180],
            )
            .map((n) => n.toFixed(3))
            .join(","),
    [points],
  );

  useEffect(() => {
    if (!signature) return;
    const [s, w, n, e] = signature.split(",").map(Number) as [number, number, number, number];
    map.fitBounds(L.latLngBounds([s, w], [n, e]), {
      padding: [32, 32],
      maxZoom: 13,
      animate: false,
    });
    // Leaflet mis-measures inside cards that animate in; nudge it once mounted.
    const id = setTimeout(() => map.invalidateSize(), 220);
    return () => clearTimeout(id);
  }, [map, signature]);
  return null;
}

/** Tracks zoom so clustering can re-bucket only when the scale changes. */
function ZoomWatch({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  return null;
}

/** Real OpenStreetMap canvas with the pooled route drawn stop by stop. */
export default function LiveMapCanvas({
  points,
  route,
  height = 300,
}: {
  points: MapPoint[];
  route?: { lat: number; lng: number }[] | undefined;
  height?: number | undefined;
}) {
  const [zoom, setZoom] = useState(11);
  const center: [number, number] = points[0] ? [points[0].lat, points[0].lng] : [19.8833, 74.4778];

  // Douglas–Peucker + hard vertex cap keeps long simulation trails cheap.
  const line = useMemo(() => {
    if (!route || route.length < 2) return null;
    const tolerance = zoom >= 13 ? 0.0002 : zoom >= 11 ? 0.0006 : 0.0015;
    return decimate(simplifyPath(route, tolerance), 400).map(
      (p) => [p.lat, p.lng] as [number, number],
    );
  }, [route, zoom]);

  // Cluster markers per kind so colours stay meaningful.
  const clusters = useMemo(() => {
    const kinds = ["mandi", "pickup", "partner", "driver"] as const;
    return kinds.flatMap((kind) =>
      clusterPoints(
        points.filter((p) => p.kind === kind),
        zoom,
        kind === "driver" ? 48 : 60,
      ).map((cluster) => ({ ...cluster, kind })),
    );
  }, [points, zoom]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      preferCanvas
      style={{ height, width: "100%" }}
      className="z-0 rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        // Lazy tiles: fetch only what is visible, and only once panning settles.
        updateWhenIdle
        updateWhenZooming={false}
        keepBuffer={1}
        maxNativeZoom={18}
        detectRetina={false}
      />
      {line && (
        <Polyline positions={line} pathOptions={{ color: "#2D6A4F", weight: 4, opacity: 0.85 }} />
      )}
      {clusters.map((cluster) => {
        const first = cluster.items[0]!;
        return (
          <Marker
            key={`${cluster.kind}-${cluster.lat.toFixed(4)}-${cluster.lng.toFixed(4)}-${cluster.items.length}`}
            position={[cluster.lat, cluster.lng]}
            icon={pin(cluster.kind, cluster.items.length)}
          >
            <Popup>
              {cluster.items.length === 1 ? (
                <>
                  <strong>{first.label}</strong>
                  {first.detail ? <div>{first.detail}</div> : null}
                </>
              ) : (
                <>
                  <strong>{cluster.items.length} stops here</strong>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                    {cluster.items.slice(0, 8).map((item) => (
                      <li key={`${item.label}-${item.lat}`}>{item.label}</li>
                    ))}
                  </ul>
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
      <ZoomWatch onZoom={setZoom} />
      <FitBounds points={points} />
    </MapContainer>
  );
}
