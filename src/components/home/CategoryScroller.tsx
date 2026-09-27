import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  ['Repairs', 'Mechanic'],
  ['Gardening', 'Gardener'],
  ['Cooking', 'Cook'],
  ['Tutoring', 'Tutor'],
  ['Photo', 'Photographer'],
  ['Design', 'Freelance Designer'],
];

export const HOME_CATEGORIES: HomeCategory[] = LABELS.map(([label, skill]) => ({ label, skill, icon: categoryStyle(skill).icon }));

export default function CategoryScroller({ selected, onSelect, onSeeAll }: { selected?: string; onSelect: (category: HomeCategory) => void; onSeeAll: () => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <SectionHeader title="Popular services" actionLabel="On the map" onAction={onSeeAll} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {HOME_CATEGORIES.map((category) => {
          const active = selected === category.skill;
          const cat = categoryStyle(category.skill);
          return (
            <TouchableOpacity key={category.label} accessibilityRole="button" accessibilityState={{ selected: active }} style={styles.item} onPress={() => onSelect(category)}>
              <View style={[styles.icon, { backgroundColor: active ? cat.color : cat.soft }]}>
                <AppIcon name={category.icon} size={22} color={active ? Colors.white : cat.color} />
              </View>
              <Text style={[styles.label, active && { color: cat.color, fontFamily: Fonts.bodyBold }]}>{category.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  header: { paddingHorizontal: Spacing.md, marginBottom: 12 },
  list: { paddingHorizontal: Spacing.md, gap: 12 },
  item: { width: 66, alignItems: 'center' },
  icon: { width: 54, height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  label: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 11, marginTop: 7, textAlign: 'center' },
});
