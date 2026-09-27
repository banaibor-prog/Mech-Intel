import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
        <SectionHeader eyebrow="Services" title="What do you need today?" />
      </View>
      <View style={styles.grid}>
        {HOME_CATEGORIES.map((category) => {
          const active = selected === category.skill;
          const cat = categoryStyle(category.skill);
          return (
            <TouchableOpacity
              key={category.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={styles.item}
              onPress={() => onSelect(category)}
              activeOpacity={0.8}>
              {active ? (
                <LinearGradient colors={[cat.color, `${cat.color}CC`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.tile, styles.tileActive]}>
                  <AppIcon name={category.icon} size={24} color={Colors.white} />
                </LinearGradient>
              ) : (
                <View style={styles.tile}>
                  <View style={[styles.halo, { backgroundColor: cat.soft }]}>
                    <AppIcon name={category.icon} size={22} color={cat.color} />
                  </View>
                </View>
              )}
              <Text style={[styles.label, active && { color: cat.color, fontFamily: Fonts.bodyBold }]} numberOfLines={1}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity accessibilityRole="button" style={styles.item} onPress={onSeeAll} activeOpacity={0.8}>
          <View style={[styles.tile, styles.moreTile]}>
            <AppIcon name="layers" size={22} color={Colors.white} />
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
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDF1F7',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  tileActive: { borderWidth: 0 },
  halo: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  moreTile: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  label: { color: Colors.text, fontFamily: Fonts.bodySemibold, fontSize: 11.5, marginTop: 8, textAlign: 'center' },
});
