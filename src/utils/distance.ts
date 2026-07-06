import type { Place } from "@/types";

const R = 6371; // km

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function totalRouteDistance(places: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < places.length; i++) total += haversine(places[i - 1], places[i]);
  return total;
}

/** Nearest-neighbour starting from a given index. */
function nearestNeighbour<T extends { lat: number; lng: number }>(places: T[], startIdx: number): T[] {
  const remaining = places.slice();
  const route: T[] = [remaining.splice(startIdx, 1)[0]];
  while (remaining.length) {
    const last = route[route.length - 1];
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(last, remaining[i]);
      if (d < bestD) { bestD = d; bestIdx = i; }
    }
    route.push(remaining.splice(bestIdx, 1)[0]);
  }
  return route;
}

/** 2-opt local-search refinement: swaps reversed sub-segments while distance improves. */
function twoOpt<T extends { lat: number; lng: number }>(route: T[]): T[] {
  if (route.length < 4) return route;
  let best = route.slice();
  let bestDist = totalRouteDistance(best);
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 50) {
    improved = false;
    for (let i = 1; i < best.length - 2; i++) {
      for (let k = i + 1; k < best.length - 1; k++) {
        const candidate = best
          .slice(0, i)
          .concat(best.slice(i, k + 1).reverse())
          .concat(best.slice(k + 1));
        const d = totalRouteDistance(candidate);
        if (d + 1e-9 < bestDist) {
          best = candidate;
          bestDist = d;
          improved = true;
        }
      }
    }
  }
  return best;
}

/**
 * Optimise a multi-stop route.
 * Tries nearest-neighbour from every possible starting node, then refines
 * the best one with 2-opt. Guaranteed to be no worse than the input order.
 */
export function optimizeRoute<T extends Place>(places: T[]): T[] {
  if (places.length <= 2) return places.slice();
  let best = places.slice();
  let bestDist = totalRouteDistance(best);
  for (let i = 0; i < places.length; i++) {
    const candidate = nearestNeighbour(places, i);
    const d = totalRouteDistance(candidate);
    if (d < bestDist) { best = candidate; bestDist = d; }
  }
  const refined = twoOpt(best);
  if (totalRouteDistance(refined) < bestDist) return refined;
  return best;
}

/** Average speed assumption for cross-Odisha road travel: 45 km/h. */
export const AVG_SPEED_KMH = 45;

export function travelHours(distanceKm: number) {
  return distanceKm / AVG_SPEED_KMH;
}
