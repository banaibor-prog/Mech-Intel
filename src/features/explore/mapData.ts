import type { MapItem } from '../../services/dataService';
import { MEGHALAYA_ZONES, Zone, zoneForPoint } from '../../data/meghalayaZones';

export type ItemKindFilter = 'jobs' | 'pros' | 'all';

export type ZoneSignal = 'highDemand' | 'underserved' | 'balanced' | 'competitive';

export const SIGNAL_META: Record<ZoneSignal, { label: string; color: string; rank: number }> = {
  highDemand: { label: 'High demand', color: '#EF4444', rank: 0 },
  underserved: { label: 'Underserved', color: '#F59E0B', rank: 1 },
  balanced: { label: 'Balanced', color: '#3B82F6', rank: 2 },
  competitive: { label: 'Competitive', color: '#64748B', rank: 3 },
};

export interface ZoneStat {
  zone: Zone;
  jobs: MapItem[];
  pros: MapItem[];
  /** Open jobs matching the skill filter. */
  demand: number;
  /** Available pros offering the skill. */
  supply: number;
  signal: ZoneSignal;
}

export function matchesSkill(item: MapItem, skill: string): boolean {
  return skill === 'All' || item.skills.includes(skill);
}

export function matchesKind(item: MapItem, kind: ItemKindFilter): boolean {
  return kind === 'all' || (kind === 'jobs' ? item.kind === 'job' : item.kind === 'pro');
}

/**
 * Demand vs supply per zone for a skill. More open jobs than pros is "high demand"; no pros
 * of that skill at all is "underserved" — e.g. a locality with no electricians is a good
 * place for an electrician to offer their services even before jobs appear there.
 */
export function computeZoneStats(items: MapItem[], skill: string): ZoneStat[] {
  const byZone = new Map<string, { jobs: MapItem[]; pros: MapItem[] }>();
  for (const zone of MEGHALAYA_ZONES) byZone.set(zone.id, { jobs: [], pros: [] });
  for (const item of items) {
    const zone = zoneForPoint(item.coords);
    if (!zone) continue;
    const bucket = byZone.get(zone.id)!;
    (item.kind === 'job' ? bucket.jobs : bucket.pros).push(item);
  }
  return MEGHALAYA_ZONES.map((zone) => {
    const { jobs, pros } = byZone.get(zone.id)!;
    const demand = jobs.filter((j) => matchesSkill(j, skill)).length;
    const supply = pros.filter((p) => matchesSkill(p, skill)).length;
    const signal: ZoneSignal =
      demand > 0 && demand >= supply ? 'highDemand' : supply === 0 ? 'underserved' : demand > 0 ? 'balanced' : 'competitive';
    return { zone, jobs, pros, demand, supply, signal };
  });
}

export function rankZones(stats: ZoneStat[]): ZoneStat[] {
  return [...stats].sort(
    (a, b) => SIGNAL_META[a.signal].rank - SIGNAL_META[b.signal].rank || b.demand - a.demand || a.supply - b.supply,
  );
}

function circlePolygon(zone: Zone, steps = 48): number[][] {
  const { lat, lng } = zone.center;
  const dLat = zone.radiusKm / 110.574;
  const dLng = zone.radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const ring: number[][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    ring.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return ring;
}

export function zonesGeoJSON(stats: ZoneStat[], skillLabel: string): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stats.map((s) => ({
      type: 'Feature',
      id: s.zone.id,
      properties: {
        id: s.zone.id,
        color: SIGNAL_META[s.signal].color,
        label: `${s.zone.name.toUpperCase()}\n${s.demand} ${s.demand === 1 ? 'job' : 'jobs'} · ${s.supply} ${skillLabel}`,
      },
      geometry: { type: 'Polygon', coordinates: [circlePolygon(s.zone)] },
    })),
  };
}

export function zoneLabelsGeoJSON(stats: ZoneStat[], skillLabel: string): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stats.map((s) => ({
      type: 'Feature',
      properties: {
        id: s.zone.id,
        color: SIGNAL_META[s.signal].color,
        label: `${s.zone.name.toUpperCase()}\n${s.demand} ${s.demand === 1 ? 'job' : 'jobs'} · ${s.supply} ${skillLabel}`,
      },
      geometry: { type: 'Point', coordinates: [s.zone.center.lng, s.zone.center.lat] },
    })),
  };
}

export function demandGeoJSON(items: MapItem[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: items
      .filter((i) => i.kind === 'job')
      .map((i) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [i.coords.lng, i.coords.lat] } })),
  };
}

export function zoneBounds(zone: Zone): [number, number, number, number] {
  const dLat = zone.radiusKm / 110.574;
  const dLng = zone.radiusKm / (111.32 * Math.cos((zone.center.lat * Math.PI) / 180));
  return [zone.center.lng - dLng, zone.center.lat - dLat, zone.center.lng + dLng, zone.center.lat + dLat];
}

/** Pin diameter for a zoom level: small dots over the whole state, full avatars at street level. */
export function pinSizeForZoom(zoom: number): number {
  const stops: [number, number][] = [
    [8, 20],
    [10, 26],
    [12, 34],
    [14, 44],
    [16, 54],
    [18, 60],
  ];
  if (zoom <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [z1, s1] = stops[i];
    const [z0, s0] = stops[i - 1];
    if (zoom <= z1) return s0 + ((zoom - z0) / (z1 - z0)) * (s1 - s0);
  }
  return stops[stops.length - 1][1];
}

export function timeAgo(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
