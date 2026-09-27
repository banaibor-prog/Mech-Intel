import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon, { AppIconName } from '../AppIcon';
import SectionHeader from './SectionHeader';
import { categoryStyle } from '../../constants/Categories';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export interface HomeCategory { label: string; skill?: string; icon: AppIconName; }

const LABELS: [string, string][] = [
  ['Electrical', 'Electrician'],
  ['Plumbing', 'Plumber'],
  ['Cleaning', 'House Cleaner'],
  ['Carpentry', 'Carpenter'],
  ['Painting', 'Painter'],
  ['Tutoring', 'Tutor'],
  ['Cooking', 'Cook'],
];

export const HOME_CATEGORIES: HomeCategory[] = LABELS.map(([label, skill]) => ({ label, skill, icon: categoryStyle(skill).icon }));

/** Four-by-two grid of the most requested services; the last tile opens everything on the map. */
export default function CategoryScroller({ selected, onSelect, onSeeAll }: { selected?: string; onSelect: (category: HomeCategory) => void; onSeeAll: () => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <SectionHeader title="Services" />
      </View>
      <View style={styles.grid}>
        {HOME_CATEGORIES.map((category) => {
          const active = selected === category.skill;
          return (
            <TouchableOpacity
              key={category.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={styles.item}
              onPress={() => onSelect(category)}
              activeOpacity={0.8}>
              <View style={[styles.tile, active && styles.tileActive]}>
                <AppIcon name={category.icon} size={23} color={active ? Colors.white : Colors.text} />
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity accessibilityRole="button" style={styles.item} onPress={onSeeAll} activeOpacity={0.8}>
          <View style={styles.tile}>
            <AppIcon name="layers" size={22} color={Colors.textLight} />
          </View>
          <Text style={styles.label}>All services</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 30 },
  header: { paddingHorizontal: Spacing.md, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md - 4, rowGap: 16 },
  item: { width: '25%', alignItems: 'center' },
  tile: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  label: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 11.5, marginTop: 8, textAlign: 'center' },
  labelActive: { color: Colors.text, fontFamily: Fonts.bodyBold },
});
