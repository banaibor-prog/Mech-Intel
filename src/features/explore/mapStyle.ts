import type { StyleSpecification } from '@maplibre/maplibre-react-native';

export type MapTheme = 'night' | 'day';

interface MapPalette {
  background: string;
  forest: string;
  grass: string;
  residential: string;
  park: string;
  water: string;
  waterLine: string;
  building: string;
  boundary: string;
  roadMinor: string;
  roadMajor: string;
  roadGlow: string;
  label: string;
  labelMinor: string;
  halo: string;
  peak: string;
}

// Night: an NFS-style game map — deep navy land, forest-green Khasi hills, glowing arterials.
// Day: misty "abode of clouds" light map in the app's palette.
const PALETTES: Record<MapTheme, MapPalette> = {
  night: {
    background: '#0B1224',
    forest: '#0F2A2B',
    grass: '#11262A',
    residential: '#111B33',
    park: '#12302C',
    water: '#0A2A52',
    waterLine: '#1D4E89',
    building: '#18223D',
    boundary: '#7C3AED',
    roadMinor: '#22304F',
    roadMajor: '#6E95EA',
    roadGlow: '#3B82F6',
    label: '#E2E8F0',
    labelMinor: '#94A3B8',
    halo: '#0B1224',
    peak: '#7DD3C0',
  },
  day: {
    background: '#EEF3FA',
    forest: '#D5E9DA',
    grass: '#E1F0DF',
    residential: '#E7ECF5',
    park: '#D3EBD6',
    water: '#BFD8F7',
    waterLine: '#8DB6EC',
    building: '#DDE3EE',
    boundary: '#7C3AED',
    roadMinor: '#FFFFFF',
    roadMajor: '#FFFFFF',
    roadGlow: '#C7D6F2',
    label: '#1E293B',
    labelMinor: '#475569',
    halo: '#FFFFFF',
    peak: '#15803D',
  },
};

const MAJOR = ['motorway', 'trunk', 'primary'];
const MID = ['secondary', 'tertiary'];

export function buildMapStyle(theme: MapTheme): StyleSpecification {
  const p = PALETTES[theme];
  return {
    version: 8,
    name: `gyc-${theme}`,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': p.background } },
      {
        id: 'landcover-forest',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
        paint: { 'fill-color': p.forest, 'fill-opacity': 0.9 },
      },
      {
        id: 'landcover-grass',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['grass', 'farmland', 'scrub']]],
        paint: { 'fill-color': p.grass, 'fill-opacity': 0.7 },
      },
      {
        id: 'landuse-residential',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        filter: ['in', ['get', 'class'], ['literal', ['residential', 'suburb', 'neighbourhood']]],
        paint: { 'fill-color': p.residential, 'fill-opacity': 0.8 },
      },
      { id: 'park', type: 'fill', source: 'openmaptiles', 'source-layer': 'park', paint: { 'fill-color': p.park, 'fill-opacity': 0.8 } },
      { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water', paint: { 'fill-color': p.water } },
      {
        id: 'waterway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        paint: { 'line-color': p.waterLine, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 2] },
      },
      {
        id: 'building',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: { 'fill-color': p.building, 'fill-opacity': 0.85 },
      },
      {
        id: 'boundary-state',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['<=', ['get', 'admin_level'], 4],
        paint: { 'line-color': p.boundary, 'line-opacity': 0.5, 'line-width': 1.2, 'line-dasharray': [3, 2] },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
        minzoom: 12,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': p.roadMinor, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 4] },
      },
      {
        id: 'road-mid',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', MID]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': theme === 'night' ? '#2D4270' : p.roadMajor,
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 16, 4],
        },
      },
      {
        id: 'road-major-glow',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', MAJOR]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': p.roadGlow,
          'line-opacity': theme === 'night' ? 0.22 : 0.9,
          'line-blur': theme === 'night' ? 3 : 0,
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1.6, 16, 9],
        },
      },
      {
        id: 'road-major',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', MAJOR]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': p.roadMajor, 'line-opacity': theme === 'night' ? 0.8 : 1, 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.7, 16, 4] },
      },
      {
        id: 'water-name',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'water_name',
        layout: { 'text-field': ['get', 'name:latin'], 'text-font': ['Noto Sans Italic'], 'text-size': 11 },
        paint: { 'text-color': p.waterLine, 'text-halo-color': p.halo, 'text-halo-width': 1.2 },
      },
      {
        id: 'peak',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'mountain_peak',
        minzoom: 10,
        layout: {
          'text-field': ['concat', '▲ ', ['coalesce', ['get', 'name:latin'], ['get', 'name']]],
          'text-font': ['Noto Sans Regular'],
          'text-size': 10.5,
          'text-anchor': 'top',
        },
        paint: { 'text-color': p.peak, 'text-halo-color': p.halo, 'text-halo-width': 1.2 },
      },
      {
        id: 'road-name',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        minzoom: 14,
        layout: {
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': 10,
        },
        paint: { 'text-color': p.labelMinor, 'text-halo-color': p.halo, 'text-halo-width': 1.2 },
      },
      {
        id: 'place-minor',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood', 'village', 'hamlet', 'quarter']]],
        minzoom: 11,
        layout: {
          'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 15, 13],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.08,
        },
        paint: { 'text-color': p.labelMinor, 'text-halo-color': p.halo, 'text-halo-width': 1.4 },
      },
      {
        id: 'place-major',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: {
          'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 6, 11, 12, 16],
          'text-letter-spacing': 0.05,
        },
        paint: { 'text-color': p.label, 'text-halo-color': p.halo, 'text-halo-width': 1.6 },
      },
    ],
  } as StyleSpecification;
}
