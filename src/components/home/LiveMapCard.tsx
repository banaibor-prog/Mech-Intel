import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import AppIcon from '../AppIcon';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

const BLIPS = [
  { x: 30, y: 36, c: '#F59E0B' },
  { x: 58, y: 24, c: '#0EA5E9' },
  { x: 70, y: 52, c: '#EF4444' },
  { x: 44, y: 60, c: '#22C55E' },
  { x: 22, y: 58, c: '#8B5CF6' },
];

/** Night-map teaser for the Explore map, styled like a game world-map radar. */
export default function LiveMapCard({ jobs, pros, onOpen }: { jobs: number; pros: number; onOpen: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel="Open the live work map">
      <Svg width={96} height={84} viewBox="0 0 90 80" style={styles.radar}>
        <G fill="none" stroke="#3B82F6" strokeOpacity={0.45}>
          <Circle cx={45} cy={42} r={34} />
          <Circle cx={45} cy={42} r={22} />
          <Circle cx={45} cy={42} r={10} />
        </G>
        <Path d="M45 42 L45 8 A34 34 0 0 1 76 30 Z" fill="#22D3EE" fillOpacity={0.18} />
        <Path d="M4 60 C18 48 28 54 40 46 C54 36 66 44 86 34" stroke="#6E95EA" strokeWidth={1.4} fill="none" strokeOpacity={0.8} />
        {BLIPS.map((b) => (
          <G key={`${b.x}-${b.y}`}>
            <Circle cx={b.x} cy={b.y} r={6} fill={b.c} fillOpacity={0.25} />
            <Circle cx={b.x} cy={b.y} r={3.2} fill={b.c} stroke="#fff" strokeWidth={1} />
          </G>
        ))}
      </Svg>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>LIVE WORK MAP</Text>
        <Text style={styles.title}>
          {jobs} open jobs · {pros} pros
        </Text>
        <Text style={styles.sub}>See hotspots across Meghalaya and where your skill is in demand.</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Open map</Text>
          <AppIcon name="arrowRight" size={14} color={Colors.friendly} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: '#0B1224',
    borderWidth: 1,
    borderColor: 'rgba(99,130,246,0.35)',
    padding: 12,
    overflow: 'hidden',
  },
  radar: { marginRight: 10 },
  copy: { flex: 1 },
  eyebrow: { color: Colors.friendly, fontFamily: Fonts.bodyBold, fontSize: 9.5, letterSpacing: 2 },
  title: { color: Colors.white, fontFamily: Fonts.display, fontSize: 16, marginTop: 3 },
  sub: { color: '#94A3B8', fontFamily: Fonts.body, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
  ctaText: { color: Colors.friendly, fontFamily: Fonts.bodyBold, fontSize: 12.5 },
});
