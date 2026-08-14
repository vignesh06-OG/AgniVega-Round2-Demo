export interface Location {
  lat: number;
  lng: number;
}

export interface Shipment {
  id: string;
  farmer_id: string;
  pickup: Location;
  weight_kg: number;
  crop_id: string;
}

export interface Truck {
  id: string;
  capacity_kg: number;
  current_location: Location;
}

export interface Mandi {
  id: string;
  location: Location;
  prices: Record<string, number>; // crop_id -> price_per_kg
}

export interface Route {
  truck_id: string;
  shipment_ids: string[];
  mandi_id: string;
  total_weight_kg: number;
  total_distance_km: number;
  enr_estimate: number;
}

// Haversine distance in km
export function getDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth radius in km
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const dLng = (loc2.lng - loc1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * (Math.PI / 180)) *
      Math.cos(loc2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// A simple greedy CVRP heuristic tailored for ENR
export function optimizeRoutes(shipments: Shipment[], trucks: Truck[], mandis: Mandi[]): Route[] {
  const routes: Route[] = [];
  let unassignedShipments = [...shipments];

  // For MVP, we group shipments that are close to each other
  // and assign them to the truck that can carry them,
  // heading to the mandi that maximizes Expected Net Realization (ENR).

  for (const truck of trucks) {
    if (unassignedShipments.length === 0) break;

    let currentLoad = 0;
    const assigned: string[] = [];
    let currentLocation = truck.current_location;
    let distanceTraveled = 0;

    // Greedy pick closest shipment that fits
    while (true) {
      let bestShipment: Shipment | null = null;
      let minDistance = Infinity;

      for (const shipment of unassignedShipments) {
        if (currentLoad + shipment.weight_kg <= truck.capacity_kg) {
          const dist = getDistance(currentLocation, shipment.pickup);
          if (dist < minDistance) {
            minDistance = dist;
            bestShipment = shipment;
          }
        }
      }

      if (!bestShipment) break; // No more shipments fit

      assigned.push(bestShipment.id);
      currentLoad += bestShipment.weight_kg;
      distanceTraveled += minDistance;
      currentLocation = bestShipment.pickup;

      unassignedShipments = unassignedShipments.filter((s) => s.id !== bestShipment.id);
    }

    if (assigned.length > 0) {
      // Find the best Mandi for these shipments based on ENR
      // ENR = (Total Crop Value) - (Transport Cost)
      // For MVP: assume 10 INR per km as transport cost
      const TRANSPORT_COST_PER_KM = 10;

      let bestMandi = mandis[0];
      let maxENR = -Infinity;
      let bestMandiDistance = 0;

      for (const mandi of mandis) {
        // Distance from last pickup to mandi
        const distToMandi = getDistance(currentLocation, mandi.location);
        const totalDist = distanceTraveled + distToMandi;
        const transportCost = totalDist * TRANSPORT_COST_PER_KM;

        // Calculate total value at this mandi
        let totalValue = 0;
        for (const sId of assigned) {
          const s = shipments.find((x) => x.id === sId)!;
          const price = mandi.prices[s.crop_id] || 0;
          totalValue += price * s.weight_kg;
        }

        const enr = totalValue - transportCost;
        if (enr > maxENR) {
          maxENR = enr;
          bestMandi = mandi;
          bestMandiDistance = totalDist;
        }
      }

      if (bestMandi) {
        routes.push({
          truck_id: truck.id,
          shipment_ids: assigned,
          mandi_id: bestMandi.id,
          total_weight_kg: currentLoad,
          total_distance_km: bestMandiDistance,
          enr_estimate: maxENR,
        });
      }
    }
  }

  return routes;
}
