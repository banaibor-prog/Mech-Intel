import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon, { AppIconName } from '../AppIcon';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

interface Props {
  onPostJob: () => void;
  onFindPros: () => void;
  onOpenMap: () => void;
  onOfferService: () => void;
}

const ACTIONS: { key: keyof Props; label: string; icon: AppIconName; primary?: boolean }[] = [
  { key: 'onPostJob', label: 'Post a job', icon: 'plus', primary: true },
  { key: 'onFindPros', label: 'Find pros', icon: 'users' },
  { key: 'onOpenMap', label: 'Live map', icon: 'map' },
  { key: 'onOfferService', label: 'Offer work', icon: 'briefcase' },
];

/** A single dock of the four things people come to Home to do. */
export default function QuickActions(props: Props) {
  return (
    <View style={styles.dock}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.key}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={styles.item}
          onPress={props[action.key]}
          activeOpacity={0.8}>
          <View style={[styles.icon, action.primary && styles.iconPrimary]}>
            <AppIcon name={action.icon} size={22} color={action.primary ? Colors.white : Colors.text} />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginTop: 18,
    paddingVertical: 16,
    paddingHorizontal: 6,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  item: { flex: 1, alignItems: 'center' },
  icon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  iconPrimary: { backgroundColor: Colors.ink },
  label: { color: Colors.text, fontFamily: Fonts.bodySemibold, fontSize: 12, marginTop: 8 },
});
