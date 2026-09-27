import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../AppIcon';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function QuickActions({ onPostJob, onOfferService }: { onPostJob: () => void; onOfferService: () => void }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={onPostJob} activeOpacity={0.86}>
        <AppIcon name="plus" size={18} color={Colors.white} />
        <Text style={styles.primaryText}>Post a job</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.secondary} onPress={onOfferService} activeOpacity={0.8}>
        <AppIcon name="briefcase" size={17} color={Colors.ink} />
        <Text style={styles.secondaryText}>Offer a service</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.md, paddingBottom: 12 },
  primary: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: Colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondary: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { color: Colors.white, fontFamily: Fonts.bodyBold, fontSize: 13 },
  secondaryText: { color: Colors.ink, fontFamily: Fonts.bodyBold, fontSize: 13 },
});
