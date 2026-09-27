import { GeoPoint } from '../types/models';

export interface Zone {
  id: string;
  name: string;
  /** Town or district shown under the zone name. */
  area: string;
  center: GeoPoint;
  radiusKm: number;
}

// Shillong localities plus the main towns across the Khasi, Jaintia and Garo hills.
export const MEGHALAYA_ZONES: Zone[] = [
  { id: 'police-bazar', name: 'Police Bazar', area: 'Shillong', center: { lat: 25.576, lng: 91.8825 }, radiusKm: 0.7 },
  { id: 'laitumkhrah', name: 'Laitumkhrah', area: 'Shillong', center: { lat: 25.5695, lng: 91.899 }, radiusKm: 0.75 },
  { id: 'laban', name: 'Laban', area: 'Shillong', center: { lat: 25.561, lng: 91.879 }, radiusKm: 0.75 },
  { id: 'mawlai', name: 'Mawlai', area: 'Shillong', center: { lat: 25.596, lng: 91.885 }, radiusKm: 1.0 },
  { id: 'nongthymmai', name: 'Nongthymmai', area: 'Shillong', center: { lat: 25.578, lng: 91.905 }, radiusKm: 0.7 },
  { id: 'rynjah', name: 'Rynjah', area: 'Shillong', center: { lat: 25.5605, lng: 91.916 }, radiusKm: 0.8 },
  { id: 'mawpat', name: 'Mawpat', area: 'Shillong', center: { lat: 25.593, lng: 91.92 }, radiusKm: 0.9 },
  { id: 'upper-shillong', name: 'Upper Shillong', area: 'Shillong', center: { lat: 25.544, lng: 91.856 }, radiusKm: 1.2 },
  { id: 'sohra', name: 'Sohra', area: 'East Khasi Hills', center: { lat: 25.2702, lng: 91.7323 }, radiusKm: 3.5 },
  { id: 'mawsynram', name: 'Mawsynram', area: 'East Khasi Hills', center: { lat: 25.2975, lng: 91.5826 }, radiusKm: 3 },
  { id: 'dawki', name: 'Dawki', area: 'West Jaintia Hills', center: { lat: 25.186, lng: 92.018 }, radiusKm: 2.5 },
  { id: 'jowai', name: 'Jowai', area: 'West Jaintia Hills', center: { lat: 25.4509, lng: 92.2089 }, radiusKm: 4 },
  { id: 'nongpoh', name: 'Nongpoh', area: 'Ri-Bhoi', center: { lat: 25.902, lng: 91.877 }, radiusKm: 3.5 },
  { id: 'nongstoin', name: 'Nongstoin', area: 'West Khasi Hills', center: { lat: 25.517, lng: 91.264 }, radiusKm: 3.5 },
  { id: 'tura', name: 'Tura', area: 'West Garo Hills', center: { lat: 25.5138, lng: 90.2036 }, radiusKm: 5 },
];

export const MEGHALAYA_CENTER: GeoPoint = { lat: 25.4, lng: 91.4 };
export const SHILLONG_CENTER: GeoPoint = { lat: 25.5788, lng: 91.8933 };

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** The nearest zone whose catchment (a little wider than its radius) contains the point. */
export function zoneForPoint(point: GeoPoint): Zone | null {
  let best: Zone | null = null;
  let bestDistance = Infinity;
  for (const zone of MEGHALAYA_ZONES) {
    const d = distanceKm(point, zone.center);
    if (d <= zone.radiusKm * 1.6 && d < bestDistance) {
      best = zone;
      bestDistance = d;
    }
  }
  return best;
}
