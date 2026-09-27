import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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

const ACTIONS: { key: keyof Props; label: string; icon: AppIconName; colors: [string, string] }[] = [
  { key: 'onPostJob', label: 'Post a job', icon: 'plus', colors: ['#3B82F6', '#7C3AED'] },
  { key: 'onFindPros', label: 'Find pros', icon: 'users', colors: ['#06B6D4', '#3B82F6'] },
  { key: 'onOpenMap', label: 'Live map', icon: 'map', colors: ['#10B981', '#0EA5E9'] },
  { key: 'onOfferService', label: 'Offer work', icon: 'briefcase', colors: ['#D9A55B', '#B07A3A'] },
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
          <LinearGradient colors={action.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
            <AppIcon name={action.icon} size={22} color={Colors.white} />
          </LinearGradient>
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
    borderColor: '#EDF1F7',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  item: { flex: 1, alignItems: 'center' },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  label: { color: Colors.text, fontFamily: Fonts.bodySemibold, fontSize: 12, marginTop: 8 },
});
