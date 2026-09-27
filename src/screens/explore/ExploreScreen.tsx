import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Camera,
  CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  MapRef,
  Marker,
  UserLocation,
  ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import Supercluster from 'supercluster';
import AppIcon, { AppIconName } from '../../components/AppIcon';
import GycLoader from '../../components/GycLoader';
import { CATEGORY_STYLES, categoryStyle } from '../../constants/Categories';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { useMode } from '../../context/ModeContext';
import { distanceKm, MEGHALAYA_CENTER, SHILLONG_CENTER, zoneForPoint } from '../../data/meghalayaZones';
import ClusterPin from '../../features/explore/ClusterPin';
import MapPin from '../../features/explore/MapPin';
import {
  computeZoneStats,
  demandGeoJSON,
  ItemKindFilter,
  matchesKind,
  matchesSkill,
  pinSizeForZoom,
  rankZones,
  SIGNAL_META,
  timeAgo,
  zoneBounds,
  zoneLabelsGeoJSON,
  zonesGeoJSON,
  ZoneStat,
} from '../../features/explore/mapData';
import { buildMapStyle, MapTheme } from '../../features/explore/mapStyle';
import { ExploreStackParamList } from '../../navigation/types';
import { listMapItems, MapItem } from '../../services/dataService';
import { ensureLocationPermission, getCurrentCoords } from '../../services/locationService';
import { GeoPoint, SKILL_CATEGORIES } from '../../types/models';

type Props = NativeStackScreenProps<ExploreStackParamList, 'Explore'>;
type Bounds = [number, number, number, number];
type PinProps = { itemId: string };
type ClusterProps = { cluster: true; cluster_id: number; point_count: number };

const TAB_BAR_CLEARANCE = 78;
const STREET_ZOOM = 14.2;
const INITIAL_ZOOM = 12.2;
const SKILL_FILTERS = ['All', ...SKILL_CATEGORIES];

const HUD = {
  night: {
    panel: 'rgba(11,18,36,0.9)',
    panelBorder: 'rgba(99,130,246,0.35)',
    text: '#F1F5F9',
    textDim: '#94A3B8',
    chip: 'rgba(30,41,59,0.95)',
    track: 'rgba(30,41,59,0.9)',
  },
  day: {
    panel: 'rgba(255,255,255,0.95)',
    panelBorder: 'rgba(59,130,246,0.25)',
    text: Colors.text,
    textDim: Colors.textLight,
    chip: '#FFFFFF',
    track: '#EAF0F8',
  },
};

export default function ExploreScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { mode } = useMode();
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);

  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<ItemKindFilter>(mode === 'working' ? 'jobs' : 'pros');
  const [skill, setSkill] = useState('All');
  const [theme, setTheme] = useState<MapTheme>('night');
  const [showZones, setShowZones] = useState(true);
  const [showHeat, setShowHeat] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<GeoPoint | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const liveZoomRef = useRef(INITIAL_ZOOM);

  const hud = HUD[theme];
  const mapStyle = useMemo(() => buildMapStyle(theme), [theme]);

  useEffect(() => {
    setKind(mode === 'working' ? 'jobs' : 'pros');
  }, [mode]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listMapItems());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    ensureLocationPermission().then((granted) => {
      setLocationGranted(granted);
      if (granted) getCurrentCoords().then(setMyLocation);
    });
  }, [load]);

  const visible = useMemo(() => items.filter((i) => matchesKind(i, kind) && matchesSkill(i, skill)), [items, kind, skill]);
  const zoneStats = useMemo(() => computeZoneStats(items, skill), [items, skill]);
  const rankedZones = useMemo(() => rankZones(zoneStats).filter((z) => z.jobs.length + z.pros.length > 0), [zoneStats]);
  const supplyLabel = skill === 'All' ? 'pros' : `${skill.toLowerCase()}s`;
  const zonesFC = useMemo(() => zonesGeoJSON(zoneStats, supplyLabel), [zoneStats, supplyLabel]);
  const zoneLabelsFC = useMemo(() => zoneLabelsGeoJSON(zoneStats, supplyLabel), [zoneStats, supplyLabel]);
  const heatFC = useMemo(() => demandGeoJSON(visible.length ? visible : items), [visible, items]);

  const index = useMemo(() => {
    const sc = new Supercluster<PinProps, Record<string, never>>({ radius: 58, maxZoom: 15, minPoints: 3 });
    sc.load(
      visible.map((i) => ({
        type: 'Feature' as const,
        properties: { itemId: i.id },
        geometry: { type: 'Point' as const, coordinates: [i.coords.lng, i.coords.lat] },
      })),
    );
    return sc;
  }, [visible]);

  const itemById = useMemo(() => {
    const m = new globalThis.Map<string, MapItem>();
    items.forEach((i) => m.set(i.id, i));
    return m;
  }, [items]);

  const clusters = useMemo(() => {
    const box: Bounds = bounds ?? [89.8, 25.0, 92.9, 26.2];
    const padX = (box[2] - box[0]) * 0.25;
    const padY = (box[3] - box[1]) * 0.25;
    return index.getClusters([box[0] - padX, box[1] - padY, box[2] + padX, box[3] + padY], Math.round(zoom));
  }, [index, bounds, zoom]);

  const selected = selectedId ? itemById.get(selectedId) ?? null : null;
  const zoneStat = zoneId ? zoneStats.find((z) => z.zone.id === zoneId) ?? null : null;
  const pinSize = pinSizeForZoom(zoom);
  const showPrices = zoom >= STREET_ZOOM;

  const onRegionIsChanging = useCallback((e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const z = e.nativeEvent.zoom;
    // Resize pins while pinching, but only re-render when the size noticeably changes.
    if (Math.abs(z - liveZoomRef.current) > 0.2) {
      liveZoomRef.current = z;
      setZoom(z);
    }
  }, []);

  const onRegionDidChange = useCallback((e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    liveZoomRef.current = e.nativeEvent.zoom;
    setZoom(e.nativeEvent.zoom);
    setBounds(e.nativeEvent.bounds as Bounds);
  }, []);

  const flyTo = (point: GeoPoint, z: number) =>
    cameraRef.current?.flyTo({ center: [point.lng, point.lat], zoom: z, duration: 900 });

  const selectItem = (item: MapItem) => {
    setSelectedId(item.id);
    setLayersOpen(false);
    setLegendOpen(false);
    flyTo(item.coords, Math.max(zoom, STREET_ZOOM));
  };

  // Arriving from a job or profile ("See on map"): select that pin once the items are loaded.
  const focusId = route.params?.focusId;
  useEffect(() => {
    if (!focusId || loading) return;
    const item = items.find((i) => i.id === focusId);
    navigation.setParams({ focusId: undefined });
    if (!item) return;
    if (!matchesKind(item, kind)) setKind('all');
    setSkill('All');
    setZoneId(null);
    const timer = setTimeout(() => selectItem(item), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, loading, items]);

  const openZone = (stat: ZoneStat) => {
    setSelectedId(null);
    setZoneId(stat.zone.id);
    setLayersOpen(false);
    cameraRef.current?.fitBounds(zoneBounds(stat.zone), {
      padding: { top: insets.top + 170, bottom: 330, left: 40, right: 70 },
      duration: 1000,
    });
  };

  const expandCluster = (clusterId: number, coords: number[]) => {
    const z = Math.min(index.getClusterExpansionZoom(clusterId) + 0.3, 17);
    cameraRef.current?.flyTo({ center: [coords[0], coords[1]], zoom: z, duration: 700 });
  };

  const onMapPress = async (e: NativeSyntheticEvent<{ point: [number, number] }>) => {
    if (showZones && mapRef.current) {
      const hits = await mapRef.current.queryRenderedFeatures(e.nativeEvent.point, { layers: ['zone-fill'] });
      const id = hits[0]?.properties?.id as string | undefined;
      const stat = id ? zoneStats.find((z) => z.zone.id === id) : undefined;
      if (stat && !selectedId) {
        openZone(stat);
        return;
      }
    }
    setSelectedId(null);
    setLayersOpen(false);
    setLegendOpen(false);
  };

  const zoomBy = (delta: number) => cameraRef.current?.zoomTo(Math.max(6, Math.min(18, zoom + delta)), { duration: 300 });
  const recenter = async () => {
    const here = myLocation ?? (await getCurrentCoords());
    if (here) {
      setMyLocation(here);
      flyTo(here, 14);
    } else {
      flyTo(SHILLONG_CENTER, INITIAL_ZOOM);
    }
  };
  const showWholeState = () => {
    setZoneId(null);
    setSelectedId(null);
    flyTo(MEGHALAYA_CENTER, 7.6);
  };

  const jobsCount = items.filter((i) => i.kind === 'job' && matchesSkill(i, skill)).length;
  const prosCount = items.filter((i) => i.kind === 'pro' && matchesSkill(i, skill)).length;
  const bottomOffset = insets.bottom + TAB_BAR_CLEARANCE;

  return (
    <View style={styles.container}>
      <Map
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        logo={false}
        attribution
        attributionPosition={{ bottom: bottomOffset + 6, left: 8 }}
        compass
        compassPosition={{ top: insets.top + 170, left: 12 }}
        scaleBar
        scaleBarPosition={{ bottom: bottomOffset + 8, left: 40 }}
        touchPitch={false}
        onRegionIsChanging={onRegionIsChanging}
        onRegionDidChange={onRegionDidChange}
        onPress={onMapPress}>
        <Camera
          ref={cameraRef}
          initialViewState={{ center: [SHILLONG_CENTER.lng, SHILLONG_CENTER.lat], zoom: INITIAL_ZOOM }}
          minZoom={6}
          maxZoom={18}
        />

        {showHeat ? (
          <GeoJSONSource id="demand" data={heatFC}>
            <Layer
              id="demand-heat"
              type="heatmap"
              maxzoom={13}
              paint={{
                'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 7, 18, 12, 40],
                'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 7, 0.8, 12, 1.6],
                'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 13, 0],
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0,
                  'rgba(0,0,0,0)',
                  0.2,
                  'rgba(34,211,238,0.35)',
                  0.5,
                  'rgba(124,58,237,0.55)',
                  0.8,
                  'rgba(245,158,11,0.7)',
                  1,
                  'rgba(239,68,68,0.85)',
                ],
              }}
            />
          </GeoJSONSource>
        ) : null}

        {showZones ? (
          <GeoJSONSource id="zones" data={zonesFC}>
            <Layer
              id="zone-fill"
              type="fill"
              paint={{
                'fill-color': ['get', 'color'],
                'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.32, 12, 0.14, 14, 0.08, 16, 0.05],
              }}
            />
            <Layer
              id="zone-line"
              type="line"
              paint={{
                'line-color': ['get', 'color'],
                'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 15, 2.5],
                'line-dasharray': [2, 1.5],
                'line-opacity': 0.9,
              }}
            />
          </GeoJSONSource>
        ) : null}
        {showZones ? (
          <GeoJSONSource id="zone-labels" data={zoneLabelsFC}>
            <Layer
              id="zone-label"
              type="symbol"
              minzoom={10.5}
              maxzoom={15.5}
              layout={{
                'text-field': ['get', 'label'],
                'text-font': ['Noto Sans Bold'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 15, 12.5],
                'text-letter-spacing': 0.06,
                'text-line-height': 1.3,
                'text-offset': [0, -3.2],
                'text-allow-overlap': false,
              }}
              paint={{
                'text-color': theme === 'night' ? '#F8FAFC' : '#0F172A',
                'text-halo-color': theme === 'night' ? '#0B1224' : '#FFFFFF',
                'text-halo-width': 1.6,
              }}
            />
          </GeoJSONSource>
        ) : null}

        {locationGranted ? <UserLocation accuracy /> : null}

        {clusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const props = feature.properties as PinProps | ClusterProps;
          if ('cluster' in props && props.cluster) {
            const leaves = index.getLeaves(props.cluster_id, 50);
            const counts: Record<string, number> = {};
            leaves.forEach((l) => {
              const it = itemById.get((l.properties as PinProps).itemId);
              if (it) counts[it.skill] = (counts[it.skill] ?? 0) + 1;
            });
            const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
            return (
              <Marker
                key={`c${props.cluster_id}`}
                id={`c${props.cluster_id}`}
                lngLat={[lng, lat]}
                anchor="center"
                onPress={() => expandCluster(props.cluster_id, [lng, lat])}>
                <ClusterPin count={props.point_count} color={categoryStyle(top).color} size={Math.max(30, pinSize)} />
              </Marker>
            );
          }
          const item = itemById.get((props as PinProps).itemId);
          if (!item) return null;
          return (
            <Marker
              key={item.id}
              id={item.id}
              lngLat={[lng, lat]}
              anchor={item.kind === 'job' ? 'bottom' : 'center'}
              onPress={() => selectItem(item)}>
              <MapPin item={item} size={pinSize} selected={item.id === selectedId} showPrice={showPrices} />
            </Marker>
          );
        })}
      </Map>

      {/* Heads-up display */}
      <View style={[styles.hud, { top: insets.top + 8, backgroundColor: hud.panel, borderColor: hud.panelBorder }]}>
        <View style={styles.hudRow}>
          <View style={styles.flex}>
            <Text style={[styles.hudEyebrow, { color: Colors.friendly }]}>MEGHALAYA · LIVE WORK MAP</Text>
            <Text style={[styles.hudTitle, { color: hud.text }]}>
              {jobsCount} open {jobsCount === 1 ? 'job' : 'jobs'} · {prosCount} pros available
            </Text>
          </View>
          <HudButton icon="book" active={legendOpen} onPress={() => setLegendOpen((v) => !v)} theme={theme} label="Legend" />
        </View>
        <View style={[styles.segment, { backgroundColor: hud.track }]}>
          {(
            [
              ['jobs', 'Jobs'],
              ['pros', 'Pros'],
              ['all', 'All'],
            ] as [ItemKindFilter, string][]
          ).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[styles.segmentBtn, kind === value && styles.segmentBtnActive]}
              activeOpacity={0.8}
              onPress={() => {
                setKind(value);
                setSelectedId(null);
              }}>
              <Text style={[styles.segmentText, { color: kind === value ? Colors.white : hud.textDim }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skillRow}>
          {SKILL_FILTERS.map((s) => {
            const cat = s === 'All' ? null : categoryStyle(s);
            const active = skill === s;
            return (
              <TouchableOpacity
                key={s}
                activeOpacity={0.8}
                onPress={() => {
                  setSkill(s);
                  setSelectedId(null);
                }}
                style={[
                  styles.skillChip,
                  { backgroundColor: active ? cat?.color ?? Colors.accent : hud.chip, borderColor: cat?.color ?? hud.panelBorder },
                ]}>
                {cat ? <AppIcon name={cat.icon} size={13} color={active ? Colors.white : cat.color} /> : null}
                <Text style={[styles.skillText, { color: active ? Colors.white : hud.text }, cat && styles.skillTextGap]}>{s}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Map controls */}
      <View style={[styles.controls, { top: insets.top + 196 }]}>
        <HudButton icon="plus" onPress={() => zoomBy(1)} theme={theme} label="Zoom in" />
        <View style={[styles.zoomReadout, { backgroundColor: hud.panel, borderColor: hud.panelBorder }]}>
          <Text style={[styles.zoomText, { color: hud.text }]}>{zoom.toFixed(1)}</Text>
          <Text style={[styles.zoomLabel, { color: hud.textDim }]}>ZOOM</Text>
        </View>
        <HudButton icon="minus" onPress={() => zoomBy(-1)} theme={theme} label="Zoom out" />
        <View style={styles.controlGap} />
        <HudButton icon="locate" onPress={recenter} theme={theme} label="My location" />
        <HudButton icon="map" onPress={showWholeState} theme={theme} label="Whole Meghalaya" />
        <HudButton icon="fire" active={showZones} onPress={() => setShowZones((v) => !v)} theme={theme} label="Hotspot zones" />
        <HudButton icon="layers" active={layersOpen} onPress={() => setLayersOpen((v) => !v)} theme={theme} label="Map layers" />
      </View>

      {layersOpen ? (
        <View style={[styles.popover, { top: insets.top + 196, backgroundColor: hud.panel, borderColor: hud.panelBorder }]}>
          <Text style={[styles.popTitle, { color: hud.textDim }]}>MAP STYLE</Text>
          <View style={styles.popRow}>
            {(['night', 'day'] as MapTheme[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setTheme(t)}
                style={[styles.popChip, theme === t && styles.popChipActive, { borderColor: hud.panelBorder }]}>
                <Text style={[styles.popChipText, { color: theme === t ? Colors.white : hud.text }]}>{t === 'night' ? 'Night' : 'Day'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.popTitle, { color: hud.textDim }]}>LAYERS</Text>
          <Toggle label="Hotspot zones" value={showZones} onChange={setShowZones} theme={theme} />
          <Toggle label="Demand heat" value={showHeat} onChange={setShowHeat} theme={theme} />
        </View>
      ) : null}

      {legendOpen ? <Legend theme={theme} top={insets.top + 150} /> : null}

      {loading ? (
        <View style={styles.loaderWrap} pointerEvents="none">
          <View style={[styles.loaderCard, { backgroundColor: hud.panel }]}>
            <GycLoader size={84} />
            <Text style={[styles.loaderText, { color: hud.text }]}>Finding work around you…</Text>
          </View>
        </View>
      ) : null}

      {/* Bottom: selected work, selected zone, or the ranked zone strip */}
      <View style={[styles.bottom, { bottom: bottomOffset }]} pointerEvents="box-none">
        {selected ? (
          <ItemCard
            item={selected}
            theme={theme}
            myLocation={myLocation}
            onClose={() => setSelectedId(null)}
            onOpen={() =>
              selected.kind === 'job'
                ? navigation.navigate('PostDetail', { postId: selected.refId })
                : navigation.navigate('PublicProfile', { uid: selected.refId })
            }
            onSecondary={() =>
              selected.kind === 'job'
                ? navigation.navigate('PublicProfile', { uid: selected.personUid })
                : navigation.navigate('ProviderDetail', { uid: selected.refId })
            }
          />
        ) : zoneStat ? (
          <ZoneCard
            stat={zoneStat}
            skill={skill}
            kind={kind}
            theme={theme}
            onClose={() => setZoneId(null)}
            onSelect={selectItem}
          />
        ) : rankedZones.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneStrip}>
            {rankedZones.map((z) => (
              <TouchableOpacity
                key={z.zone.id}
                activeOpacity={0.85}
                onPress={() => openZone(z)}
                style={[styles.zoneChip, { backgroundColor: hud.panel, borderColor: SIGNAL_META[z.signal].color }]}>
                <View style={styles.zoneChipTop}>
                  <View style={[styles.signalDot, { backgroundColor: SIGNAL_META[z.signal].color }]} />
                  <Text style={[styles.zoneChipSignal, { color: SIGNAL_META[z.signal].color }]}>
                    {SIGNAL_META[z.signal].label.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.zoneChipName, { color: hud.text }]} numberOfLines={1}>
                  {z.zone.name}
                </Text>
                <Text style={[styles.zoneChipStats, { color: hud.textDim }]}>
                  {z.demand} {z.demand === 1 ? 'job' : 'jobs'} · {z.supply} {supplyLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

function HudButton({
  icon,
  onPress,
  active,
  theme,
  label,
}: {
  icon: AppIconName;
  onPress: () => void;
  active?: boolean;
  theme: MapTheme;
  label: string;
}) {
  const hud = HUD[theme];
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityLabel={label}
      style={[
        styles.hudBtn,
        { backgroundColor: active ? Colors.accent : hud.panel, borderColor: active ? Colors.accent : hud.panelBorder },
      ]}>
      <AppIcon name={icon} size={19} color={active ? Colors.white : hud.text} />
    </TouchableOpacity>
  );
}

function Toggle({ label, value, onChange, theme }: { label: string; value: boolean; onChange: (v: boolean) => void; theme: MapTheme }) {
  const hud = HUD[theme];
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={() => onChange(!value)} activeOpacity={0.8}>
      <Text style={[styles.toggleLabel, { color: hud.text }]}>{label}</Text>
      <View style={[styles.toggleTrack, { backgroundColor: value ? Colors.accent : hud.track }]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

function Legend({ theme, top }: { theme: MapTheme; top: number }) {
  const hud = HUD[theme];
  const sample = ['Electrician', 'Plumber', 'House Cleaner', 'Carpenter', 'Tutor', 'Cook'];
  return (
    <View style={[styles.legend, { top, backgroundColor: hud.panel, borderColor: hud.panelBorder }]}>
      <Text style={[styles.popTitle, { color: hud.textDim }]}>SYMBOLOGY</Text>
      <View style={styles.legendRow}>
        <View style={[styles.legendPin, { borderColor: Colors.accent }]} />
        <View style={[styles.legendTail, { borderTopColor: Colors.accent }]} />
        <Text style={[styles.legendText, { color: hud.text }]}>Job: someone needs help</Text>
      </View>
      <View style={styles.legendRow}>
        <View style={[styles.legendPin, { borderColor: Colors.accent }]}>
          <View style={styles.legendDot} />
        </View>
        <Text style={[styles.legendText, { color: hud.text, marginLeft: 12 }]}>Pro: available to work</Text>
      </View>
      <Text style={[styles.legendHint, { color: hud.textDim }]}>Ring colour = kind of work. Numbers = grouped pins, tap to zoom in.</Text>
      <View style={styles.legendSwatches}>
        {sample.map((s) => (
          <View key={s} style={styles.swatch}>
            <View style={[styles.swatchDot, { backgroundColor: CATEGORY_STYLES[s].color }]} />
            <Text style={[styles.swatchText, { color: hud.text }]}>{s}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.popTitle, { color: hud.textDim, marginTop: 10 }]}>ZONES</Text>
      {(Object.keys(SIGNAL_META) as (keyof typeof SIGNAL_META)[]).map((k) => (
        <View key={k} style={styles.swatch}>
          <View style={[styles.swatchDot, { backgroundColor: SIGNAL_META[k].color }]} />
          <Text style={[styles.swatchText, { color: hud.text }]}>
            {SIGNAL_META[k].label}
            {k === 'highDemand' ? ': more jobs than pros' : k === 'underserved' ? ': no pros of this skill yet' : k === 'competitive' ? ': many pros, few jobs' : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ItemCard({
  item,
  theme,
  myLocation,
  onClose,
  onOpen,
  onSecondary,
}: {
  item: MapItem;
  theme: MapTheme;
  myLocation: GeoPoint | null;
  onClose: () => void;
  onOpen: () => void;
  onSecondary: () => void;
}) {
  const hud = HUD[theme];
  const cat = categoryStyle(item.skill);
  const zone = zoneForPoint(item.coords);
  const dist = myLocation ? distanceKm(myLocation, item.coords) : null;
  const rise = useRef(new Animated.Value(40)).current;
  useEffect(() => {
    rise.setValue(40);
    Animated.spring(rise, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 6 }).start();
  }, [item.id, rise]);

  return (
    <Animated.View
      style={[styles.card, { backgroundColor: hud.panel, borderColor: cat.color, transform: [{ translateY: rise }] }]}>
      <View style={[styles.cardStripe, { backgroundColor: cat.color }]} />
      <View style={styles.cardHead}>
        <View style={[styles.cardAvatar, { borderColor: cat.color, backgroundColor: cat.soft }]}>
          {item.photoURL ? <Image source={{ uri: item.photoURL }} style={styles.cardAvatarImg} /> : <AppIcon name={cat.icon} size={22} color={cat.color} />}
        </View>
        <View style={styles.flex}>
          <View style={styles.cardTags}>
            <View style={[styles.kindTag, { backgroundColor: item.kind === 'job' ? cat.color : '#16A34A' }]}>
              <Text style={styles.kindTagText}>{item.kind === 'job' ? 'NEEDS HELP' : 'AVAILABLE'}</Text>
            </View>
            <View style={[styles.catTag, { backgroundColor: cat.soft }]}>
              <AppIcon name={cat.icon} size={11} color={cat.color} />
              <Text style={[styles.catTagText, { color: cat.color }]}>{item.skill}</Text>
            </View>
          </View>
          <Text style={[styles.cardTitle, { color: hud.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.cardMeta, { color: hud.textDim }]} numberOfLines={1}>
            {item.kind === 'job' ? `${item.personName} · ${timeAgo(item.createdAt)}` : item.subtitle}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close">
          <AppIcon name="close" size={18} color={hud.textDim} />
        </TouchableOpacity>
      </View>

      <View style={styles.statRow}>
        {item.price ? (
          <Stat label={item.kind === 'job' ? 'BUDGET' : 'RATE'} value={`₹${item.price}${item.priceUnit === 'hour' ? '/hr' : ''}`} theme={theme} />
        ) : null}
        <Stat label="TRUST" value={`${item.trustScore}`} theme={theme} />
        {dist !== null ? <Stat label="DISTANCE" value={dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`} theme={theme} /> : null}
        <Stat label="ZONE" value={zone?.name ?? item.locationLabel ?? '—'} theme={theme} />
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.primaryAction, { backgroundColor: cat.color }]} onPress={onOpen} activeOpacity={0.85}>
          <Text style={styles.primaryActionText}>{item.kind === 'job' ? 'View job & apply' : 'View profile'}</Text>
          <AppIcon name="arrowRight" size={16} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryAction, { borderColor: hud.panelBorder }]} onPress={onSecondary} activeOpacity={0.85}>
          <Text style={[styles.secondaryActionText, { color: hud.text }]}>{item.kind === 'job' ? 'Poster' : 'Book'}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function Stat({ label, value, theme }: { label: string; value: string; theme: MapTheme }) {
  const hud = HUD[theme];
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: hud.textDim }]}>{label}</Text>
      <Text style={[styles.statValue, { color: hud.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ZoneCard({
  stat,
  skill,
  kind,
  theme,
  onClose,
  onSelect,
}: {
  stat: ZoneStat;
  skill: string;
  kind: ItemKindFilter;
  theme: MapTheme;
  onClose: () => void;
  onSelect: (item: MapItem) => void;
}) {
  const hud = HUD[theme];
  const meta = SIGNAL_META[stat.signal];
  const works = [...stat.jobs, ...stat.pros].filter((i) => matchesKind(i, kind) && matchesSkill(i, skill));
  const who = skill === 'All' ? 'pros' : `${skill.toLowerCase()}s`;
  const advice =
    stat.signal === 'highDemand'
      ? `${stat.demand} open ${stat.demand === 1 ? 'job' : 'jobs'} and only ${stat.supply} ${who} here. Great area to pick up work.`
      : stat.signal === 'underserved'
        ? `No ${who} are active here yet. Offering your service in ${stat.zone.name} puts you first in line.`
        : stat.signal === 'balanced'
          ? `Demand and supply are even. Good ratings and fast replies stand out here.`
          : `Plenty of ${who} but few open jobs right now.`;

  return (
    <View style={[styles.card, { backgroundColor: hud.panel, borderColor: meta.color }]}>
      <View style={[styles.cardStripe, { backgroundColor: meta.color }]} />
      <View style={styles.cardHead}>
        <View style={styles.flex}>
          <Text style={[styles.hudEyebrow, { color: meta.color }]}>{meta.label.toUpperCase()} ZONE</Text>
          <Text style={[styles.cardTitle, { color: hud.text }]}>
            {stat.zone.name} <Text style={{ color: hud.textDim, fontFamily: Fonts.bodyMedium }}>· {stat.zone.area}</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityLabel="Close zone">
          <AppIcon name="close" size={18} color={hud.textDim} />
        </TouchableOpacity>
      </View>
      <View style={styles.statRow}>
        <Stat label={skill === 'All' ? 'OPEN JOBS' : `${skill.toUpperCase()} JOBS`} value={`${stat.demand}`} theme={theme} />
        <Stat label={`${who.toUpperCase()} HERE`} value={`${stat.supply}`} theme={theme} />
        <Stat label="ALL WORK" value={`${stat.jobs.length + stat.pros.length}`} theme={theme} />
      </View>
      <Text style={[styles.advice, { color: hud.textDim }]}>{advice}</Text>
      {works.length ? (
        <FlatList
          horizontal
          data={works}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.zoneWorks}
          renderItem={({ item }) => {
            const cat = categoryStyle(item.skill);
            return (
              <TouchableOpacity onPress={() => onSelect(item)} activeOpacity={0.85} style={[styles.workChip, { borderColor: cat.color, backgroundColor: hud.chip }]}>
                <View style={[styles.workAvatar, { borderColor: cat.color }]}>
                  {item.photoURL ? <Image source={{ uri: item.photoURL }} style={styles.workAvatarImg} /> : <AppIcon name={cat.icon} size={16} color={cat.color} />}
                </View>
                <View style={styles.workText}>
                  <Text style={[styles.workTitle, { color: hud.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.workMeta, { color: cat.color }]} numberOfLines={1}>
                    {item.kind === 'job' ? 'Job' : 'Pro'} · {item.skill}
                    {item.price ? ` · ₹${item.price}${item.priceUnit === 'hour' ? '/hr' : ''}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <Text style={[styles.advice, { color: hud.textDim }]}>Nothing matching your filters in this zone right now.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1224' },
  flex: { flex: 1 },
  hud: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  hudRow: { flexDirection: 'row', alignItems: 'center' },
  hudEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 2 },
  hudTitle: { fontFamily: Fonts.display, fontSize: 16, marginTop: 2, letterSpacing: -0.2 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 3, marginTop: 10 },
  segmentBtn: { flex: 1, paddingVertical: 7, borderRadius: 9, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: Colors.accent },
  segmentText: { fontFamily: Fonts.bodyBold, fontSize: 12.5, letterSpacing: 0.3 },
  skillRow: { paddingTop: 10, gap: 6 },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  skillText: { fontFamily: Fonts.bodySemibold, fontSize: 12 },
  skillTextGap: { marginLeft: 5 },
  controls: { position: 'absolute', right: 10, alignItems: 'center', gap: 8 },
  controlGap: { height: 4 },
  hudBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  zoomReadout: { width: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', paddingVertical: 3 },
  zoomText: { fontFamily: Fonts.bodyBold, fontSize: 12 },
  zoomLabel: { fontFamily: Fonts.bodySemibold, fontSize: 7.5, letterSpacing: 1 },
  popover: {
    position: 'absolute',
    right: 60,
    width: 200,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    elevation: 10,
  },
  popTitle: { fontFamily: Fonts.bodyBold, fontSize: 9.5, letterSpacing: 1.8, marginBottom: 6 },
  popRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  popChip: { flex: 1, paddingVertical: 7, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  popChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  popChipText: { fontFamily: Fonts.bodySemibold, fontSize: 12.5 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  toggleLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13 },
  toggleTrack: { width: 36, height: 20, borderRadius: 10, padding: 2 },
  toggleThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.white },
  toggleThumbOn: { transform: [{ translateX: 16 }] },
  legend: {
    position: 'absolute',
    left: 10,
    right: 64,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    elevation: 10,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendPin: { width: 22, height: 22, borderRadius: 11, borderWidth: 3, backgroundColor: '#CBD5E1' },
  legendTail: {
    position: 'absolute',
    left: 7,
    top: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  legendDot: {
    position: 'absolute',
    right: -5,
    bottom: -4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  legendText: { fontFamily: Fonts.bodyMedium, fontSize: 12.5, marginLeft: 12 },
  legendHint: { fontFamily: Fonts.body, fontSize: 11.5, lineHeight: 16, marginBottom: 8 },
  legendSwatches: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 },
  swatch: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  swatchDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  swatchText: { fontFamily: Fonts.body, fontSize: 11.5 },
  loaderWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  loaderCard: { borderRadius: 22, paddingVertical: 18, paddingHorizontal: 26, alignItems: 'center' },
  loaderText: { fontFamily: Fonts.bodySemibold, fontSize: 13.5, marginTop: 4 },
  bottom: { position: 'absolute', left: 0, right: 0 },
  zoneStrip: { paddingHorizontal: 10, gap: 8, paddingBottom: 6 },
  zoneChip: {
    width: 168,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 6,
  },
  zoneChipTop: { flexDirection: 'row', alignItems: 'center' },
  signalDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  zoneChipSignal: { fontFamily: Fonts.bodyBold, fontSize: 9.5, letterSpacing: 1.4 },
  zoneChipName: { fontFamily: Fonts.display, fontSize: 15, marginTop: 4 },
  zoneChipStats: { fontFamily: Fonts.bodyMedium, fontSize: 11.5, marginTop: 1 },
  card: {
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 14,
    paddingTop: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  cardStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start' },
  cardAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardAvatarImg: { width: '100%', height: '100%' },
  cardTags: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  kindTag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  kindTagText: { fontFamily: Fonts.bodyBold, fontSize: 9, letterSpacing: 1, color: Colors.white },
  catTag: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, gap: 4 },
  catTagText: { fontFamily: Fonts.bodySemibold, fontSize: 10.5 },
  cardTitle: { fontFamily: Fonts.display, fontSize: 16.5, letterSpacing: -0.2 },
  cardMeta: { fontFamily: Fonts.body, fontSize: 12.5, marginTop: 2 },
  statRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  stat: { flex: 1 },
  statLabel: { fontFamily: Fonts.bodyBold, fontSize: 8.5, letterSpacing: 1.3 },
  statValue: { fontFamily: Fonts.bodyBold, fontSize: 13.5, marginTop: 2 },
  cardActions: { flexDirection: 'row', marginTop: 14, gap: 8 },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 12,
  },
  primaryActionText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },
  secondaryAction: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  secondaryActionText: { fontFamily: Fonts.bodyBold, fontSize: 14 },
  advice: { fontFamily: Fonts.body, fontSize: 12.5, lineHeight: 18, marginTop: 10 },
  zoneWorks: { gap: 8, paddingTop: 10 },
  workChip: {
    width: 210,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 8,
  },
  workAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 8,
  },
  workAvatarImg: { width: '100%', height: '100%' },
  workText: { flex: 1 },
  workTitle: { fontFamily: Fonts.bodySemibold, fontSize: 12.5 },
  workMeta: { fontFamily: Fonts.bodyMedium, fontSize: 11, marginTop: 1 },
});
