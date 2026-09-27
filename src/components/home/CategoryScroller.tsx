import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon, { AppIconName } from '../AppIcon';
import SectionHeader from './SectionHeader';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export interface HomeCategory { label: string; skill?: string; icon: AppIconName; }
export const HOME_CATEGORIES: HomeCategory[] = [
  { label: 'Electrical', skill: 'Electrician', icon: 'bolt' },
  { label: 'Plumbing', skill: 'Plumber', icon: 'droplet' },
  { label: 'Cleaning', skill: 'House Cleaner', icon: 'sparkles' },
  { label: 'Repairs', skill: 'Mechanic', icon: 'tool' },
  { label: 'Design', skill: 'Freelance Designer', icon: 'monitor' },
  { label: 'Photo', skill: 'Photographer', icon: 'camera' },
  { label: 'Tutoring', skill: 'Tutor', icon: 'book' },
];

export default function CategoryScroller({ selected, onSelect, onSeeAll }: { selected?: string; onSelect: (category: HomeCategory) => void; onSeeAll: () => void }) {
  return <View style={styles.section}><View style={styles.header}><SectionHeader title="Popular services" actionLabel="See all" onAction={onSeeAll} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>{HOME_CATEGORIES.map((category) => { const active = selected === category.skill; return <TouchableOpacity key={category.label} accessibilityRole="button" style={styles.item} onPress={() => onSelect(category)}><View style={[styles.icon, active && styles.iconActive]}><AppIcon name={category.icon} size={20} color={active ? Colors.white : Colors.ink} /></View><Text style={[styles.label, active && styles.labelActive]}>{category.label}</Text></TouchableOpacity>; })}</ScrollView></View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  header: { paddingHorizontal: Spacing.md, marginBottom: 9 },
  list: { paddingHorizontal: Spacing.md, gap: 14 },
  item: { width: 62, minHeight: 70, alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  iconActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  label: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 10.5, marginTop: 6, textAlign: 'center' },
  labelActive: { color: Colors.accent, fontFamily: Fonts.bodyBold },
});
