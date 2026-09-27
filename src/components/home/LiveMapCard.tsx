import React, { useEffect, useId, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import AppIcon from '../AppIcon';
import Avatar from '../Avatar';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export interface MapTeaserPin {
  id: string;
  name: string;
  photoURL?: string;
  color: string;
  kind: 'job' | 'pro';
}

interface Props {
  jobs: number;
  pros: number;
  pins: MapTeaserPin[];
  /** Headline for the busiest under-served zone, e.g. "Laitumkhrah needs electricians". */
  hotspot?: string;
  onOpen: () => void;
}

// Pin slots on the stylised map, as fractions of the card's map area.
const SLOTS = [
  { x: 0.16, y: 0.36, s: 38 },
  { x: 0.38, y: 0.2, s: 32 },
  { x: 0.58, y: 0.42, s: 42 },
  { x: 0.8, y: 0.22, s: 34 },
  { x: 0.29, y: 0.62, s: 30 },
  { x: 0.9, y: 0.58, s: 30 },
];
const MAP_HEIGHT = 168;

/** A living preview of the Explore map: night terrain, a pulsing hotspot and real profile pins. */
export default function LiveMapCard({ jobs, pros, pins, hotspot, onOpen }: Props) {
  const uid = useId().replace(/:/g, '');
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.55, 0.12, 0] });

  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.92} accessibilityRole="button" accessibilityLabel="Open the live work map">
      <View style={styles.map}>
        <Svg width="100%" height="100%" viewBox="0 0 360 168" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id={`land${uid}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#0C1638" />
              <Stop offset="1" stopColor="#101D4A" />
            </SvgGradient>
            <RadialGradient id={`hot${uid}`} cx="210" cy="72" r="70" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#EF4444" stopOpacity="0.55" />
              <Stop offset="0.5" stopColor="#F59E0B" stopOpacity="0.22" />
              <Stop offset="1" stopColor="#F59E0B" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id={`cool${uid}`} cx="60" cy="60" r="60" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#3B82F6" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="360" height="168" fill={`url(#land${uid})`} />
          {/* forest patches and contour lines */}
          <G fill="#143A3A" opacity={0.55}>
            <Path d="M0 120 C 30 104, 60 118, 84 132 C 100 142, 60 168, 0 168 Z" />
            <Path d="M290 0 C 310 20, 350 18, 360 30 L 360 0 Z" />
            <Path d="M250 150 C 270 132, 310 138, 330 168 L 240 168 Z" />
          </G>
          <G fill="none" stroke="#2B3C7A" strokeWidth={0.8} opacity={0.7}>
            <Path d="M-10 40 C 50 20, 110 60, 170 40 S 290 10, 370 36" />
            <Path d="M-10 70 C 60 50, 120 92, 190 70 S 300 44, 370 70" />
            <Path d="M-10 146 C 70 128, 150 160, 230 138 S 320 120, 370 132" />
          </G>
          {/* river */}
          <Path d="M-10 100 C 40 92, 70 110, 120 104 S 200 118, 250 112 S 330 96, 370 104" stroke="#22D3EE" strokeOpacity={0.45} strokeWidth={3} fill="none" />
          {/* roads */}
          <G fill="none" stroke="#5B7BE0" strokeLinecap="round">
            <Path d="M20 168 C 60 130, 110 120, 150 90 S 230 40, 360 20" strokeWidth={2.2} strokeOpacity={0.7} />
            <Path d="M0 60 C 60 64, 120 80, 180 82 S 300 90, 360 120" strokeWidth={1.4} strokeOpacity={0.5} />
            <Path d="M150 0 C 160 40, 190 80, 200 168" strokeWidth={1.2} strokeOpacity={0.4} />
          </G>
          <Circle cx="60" cy="60" r="60" fill={`url(#cool${uid})`} />
          <Circle cx="210" cy="72" r="70" fill={`url(#hot${uid})`} />
          <Circle cx="210" cy="72" r="44" fill="none" stroke="#F59E0B" strokeOpacity={0.55} strokeDasharray="3 4" />
        </Svg>

        <Animated.View style={[styles.pulse, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />

        {pins.slice(0, SLOTS.length).map((pin, i) => {
          const slot = SLOTS[i];
          return (
            <View
              key={pin.id}
              style={[
                styles.pin,
                { left: `${slot.x * 100}%`, top: slot.y * MAP_HEIGHT, marginLeft: -slot.s / 2, width: slot.s, height: slot.s, borderRadius: slot.s / 2, borderColor: pin.color },
              ]}>
              {pin.photoURL ? (
                <Image source={{ uri: pin.photoURL }} style={{ width: slot.s - 6, height: slot.s - 6, borderRadius: (slot.s - 6) / 2 }} />
              ) : (
                <Avatar name={pin.name} size={slot.s - 6} />
              )}
              {pin.kind === 'job' ? <View style={[styles.tail, { borderTopColor: pin.color }]} /> : <View style={styles.onlineDot} />}
            </View>
          );
        })}

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>MEGHALAYA WORK MAP</Text>
          <Text style={styles.title} numberOfLines={1}>
            {hotspot ?? 'See where work is waiting'}
          </Text>
          <View style={styles.chips}>
            <Text style={styles.chipText}>
              <Text style={styles.chipStrong}>{jobs}</Text> jobs
            </Text>
            <View style={styles.chipDot} />
            <Text style={styles.chipText}>
              <Text style={styles.chipStrong}>{pros}</Text> pros
            </Text>
            <View style={styles.chipDot} />
            <Text style={styles.chipText}>hotspot zones</Text>
          </View>
        </View>
        <View style={styles.go}>
          <AppIcon name="arrowRight" size={18} color={Colors.white} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    marginHorizontal: Spacing.md,
    marginTop: 18,
    borderRadius: 26,
    backgroundColor: '#0A1230',
    overflow: 'hidden',
    shadowColor: '#0B153F',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  map: { height: MAP_HEIGHT },
  pulse: {
    position: 'absolute',
    left: '58.3%',
    top: 72 - 60,
    marginLeft: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  pin: {
    position: 'absolute',
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  tail: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#0A1230',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10,18,48,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F43F5E' },
  liveText: { color: Colors.white, fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1.4 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  eyebrow: { color: '#67E8F9', fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1.8 },
  title: { color: Colors.white, fontFamily: Fonts.display, fontSize: 17, letterSpacing: -0.2, marginTop: 3 },
  chips: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  chipText: { color: 'rgba(224,231,255,0.7)', fontFamily: Fonts.bodyMedium, fontSize: 12 },
  chipStrong: { color: Colors.white, fontFamily: Fonts.bodyBold },
  chipDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(224,231,255,0.4)', marginHorizontal: 7 },
  go: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
