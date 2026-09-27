import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export type HomeFeedTab = 'For You' | 'Nearby' | 'Urgent' | 'Following';
const TABS: HomeFeedTab[] = ['For You', 'Nearby', 'Urgent', 'Following'];

export default function FeedTabs({ active, onChange }: { active: HomeFeedTab; onChange: (tab: HomeFeedTab) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {TABS.map((tab) => {
        const selected = active === tab;
        return (
          <TouchableOpacity
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab)}
            style={[styles.tab, selected && styles.tabActive]}
            activeOpacity={0.8}>
            <Text style={[styles.label, selected && styles.labelActive]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: Spacing.md, gap: 8, paddingTop: 18 },
  tab: { paddingHorizontal: 16, height: 36, borderRadius: 999, justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  label: { color: Colors.textLight, fontFamily: Fonts.bodySemibold, fontSize: 13 },
  labelActive: { color: Colors.white },
});
