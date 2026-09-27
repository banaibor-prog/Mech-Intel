import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export type HomeFeedTab = 'For You' | 'Nearby' | 'Urgent' | 'Following';
const TABS: HomeFeedTab[] = ['For You', 'Nearby', 'Urgent', 'Following'];

/** Segmented control for the job feed. */
export default function FeedTabs({ active, onChange }: { active: HomeFeedTab; onChange: (tab: HomeFeedTab) => void }) {
  return (
    <View style={styles.track}>
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
            {tab === 'Urgent' ? <View style={[styles.urgentDot, selected && styles.urgentDotActive]} /> : null}
            <Text style={[styles.label, selected && styles.labelActive]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginTop: 14,
    padding: 4,
    borderRadius: 18,
    backgroundColor: '#E8EEF7',
  },
  tab: { flex: 1, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  tabActive: {
    backgroundColor: Colors.ink,
    shadowColor: '#0B153F',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  label: { color: Colors.textLight, fontFamily: Fonts.bodySemibold, fontSize: 12.5 },
  labelActive: { color: Colors.white },
  urgentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F43F5E' },
  urgentDotActive: { backgroundColor: '#FB7185' },
});
