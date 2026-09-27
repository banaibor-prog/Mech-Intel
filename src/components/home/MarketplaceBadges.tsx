import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppIcon from '../AppIcon';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';

export function TrustBadge({ score }: { score: number }) {
  return <View style={styles.trust}><AppIcon name="verified" size={13} color={Colors.accent} /><Text style={styles.trustText}>Trust {score}</Text></View>;
}

export function VerificationBadge() {
  return <View accessibilityLabel="Identity verified"><AppIcon name="verified" size={15} color={Colors.accent} filled /></View>;
}

export function AvailabilityBadge({ label = 'Available now' }: { label?: string }) {
  return <View style={styles.availability}><View style={styles.dot} /><Text style={styles.availabilityText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  trust: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.accentSoft, borderRadius: 8, paddingHorizontal: 7, height: 24 },
  trustText: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 11 },
  availability: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.successSoft, borderRadius: 8, paddingHorizontal: 7, height: 24 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  availabilityText: { color: Colors.success, fontFamily: Fonts.bodySemibold, fontSize: 10 },
});
