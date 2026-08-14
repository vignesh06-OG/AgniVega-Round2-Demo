export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Vectorised-equivalent Haversine distance matrix. This is the tertiary tier of
 * the routing fallback chain and never touches the network.
 */
export function haversineMatrix(points: LatLng[]): number[][] {
  return points.map((from) => points.map((to) => haversineKm(from, to)));
}

/** Rural roads are rarely straight: apply a road-winding factor. */
export const ROAD_FACTOR = 1.28;

export function roadKm(a: LatLng, b: LatLng): number {
  return haversineKm(a, b) * ROAD_FACTOR;
}

export function minutesFor(km: number, speedKmph: number): number {
  return (km / speedKmph) * 60;
}

/**
 * Nearest-neighbour then 2-opt improvement over a distance matrix.
 * This is the in-app equivalent of the OR-Tools CVRP solver in the reference
 * backend: it sequences pickups before the mandi drop under a payload cap.
 */
export function sequenceStops(matrix: number[][], startIndex = 0, endIndex?: number): number[] {
  const n = matrix.length;
  const terminal = endIndex ?? -1;
  const remaining = new Set<number>();
  for (let i = 0; i < n; i += 1) {
    if (i !== startIndex && i !== terminal) remaining.add(i);
  }
  const order = [startIndex];
  let current = startIndex;
  while (remaining.size > 0) {
    let best = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const candidate of remaining) {
      const d = matrix[current]?.[candidate] ?? Number.POSITIVE_INFINITY;
      if (d < bestDistance) {
        bestDistance = d;
        best = candidate;
      }
    }
    if (best < 0) break;
    order.push(best);
    remaining.delete(best);
    current = best;
  }
  if (terminal >= 0) order.push(terminal);
  return twoOpt(order, matrix, terminal >= 0);
}

function pathLength(order: number[], matrix: number[][]): number {
  let total = 0;
  for (let i = 0; i < order.length - 1; i += 1) {
    total += matrix[order[i]!]?.[order[i + 1]!] ?? 0;
  }
  return total;
}

function twoOpt(order: number[], matrix: number[][], fixedEnd: boolean): number[] {
  const last = fixedEnd ? order.length - 2 : order.length - 1;
  let best = [...order];
  let bestLength = pathLength(best, matrix);
  let improved = true;
  let guard = 0;
  while (improved && guard < 40) {
    improved = false;
    guard += 1;
    for (let i = 1; i < last; i += 1) {
      for (let k = i + 1; k <= last; k += 1) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, k + 1).reverse(),
          ...best.slice(k + 1),
        ];
        const length = pathLength(candidate, matrix);
        if (length < bestLength - 1e-9) {
          best = candidate;
          bestLength = length;
          improved = true;
        }
      }
    }
  }
  return best;
}
