/**
 * Pure map-performance helpers: Douglas–Peucker polyline simplification and
 * pixel-grid marker clustering. Kept framework-free so they can be unit tested
 * without Leaflet or a DOM.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Web-Mercator projection to pixel space at a given zoom (256px tiles). */
export function project(point: LatLng, zoom: number): { x: number; y: number } {
  const scale = 256 * Math.pow(2, zoom);
  const sinLat = Math.sin((point.lat * Math.PI) / 180);
  return {
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function perpendicularDistance(p: LatLng, a: LatLng, b: LatLng): number {
  const x = p.lng;
  const y = p.lat;
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  if (dx === 0 && dy === 0) return Math.hypot(x - a.lng, y - a.lat);
  const t = ((x - a.lng) * dx + (y - a.lat) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (a.lng + clamped * dx), y - (a.lat + clamped * dy));
}

/**
 * Douglas–Peucker simplification. `tolerance` is in degrees; ~0.0005 keeps a
 * road-shaped line visually identical while dropping most vertices.
 */
export function simplifyPath(points: LatLng[], tolerance = 0.0005): LatLng[] {
  if (points.length <= 2 || tolerance <= 0) return points;
  const first = points[0]!;
  const last = points[points.length - 1]!;

  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const dist = perpendicularDistance(points[i]!, first, last);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist <= tolerance) return [first, last];
  const left = simplifyPath(points.slice(0, index + 1), tolerance);
  const right = simplifyPath(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

/** Hard cap on rendered vertices — protects long simulation trails. */
export function decimate<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const step = items.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i += 1) out.push(items[Math.floor(i * step)]!);
  const last = items[items.length - 1]!;
  if (out[out.length - 1] !== last) out[out.length - 1] = last;
  return out;
}

export interface Cluster<T extends LatLng> {
  lat: number;
  lng: number;
  items: T[];
}

/**
 * Groups markers that fall within `cellPx` pixels of each other at the current
 * zoom, so a long simulation with hundreds of drivers still paints a handful of
 * DOM nodes instead of hundreds.
 */
export function clusterPoints<T extends LatLng>(
  points: T[],
  zoom: number,
  cellPx = 60,
): Cluster<T>[] {
  const cells = new Map<string, T[]>();
  for (const point of points) {
    const { x, y } = project(point, zoom);
    const key = `${Math.floor(x / cellPx)}:${Math.floor(y / cellPx)}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(point);
    else cells.set(key, [point]);
  }
  return [...cells.values()].map((items) => ({
    lat: items.reduce((s, p) => s + p.lat, 0) / items.length,
    lng: items.reduce((s, p) => s + p.lng, 0) / items.length,
    items,
  }));
}
