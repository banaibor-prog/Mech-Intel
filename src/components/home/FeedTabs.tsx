import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export type HomeFeedTab = 'For You' | 'Nearby' | 'Urgent' | 'Following';
const TABS: HomeFeedTab[] = ['For You', 'Nearby', 'Urgent', 'Following'];

export default function FeedTabs({ active, onChange }: { active: HomeFeedTab; onChange: (tab: HomeFeedTab) => void }) {
  return (
    <View style={styles.shell}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TABS.map((tab) => {
          const selected = active === tab;
          return <TouchableOpacity key={tab} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(tab)} style={styles.tab}>
            <Text style={[styles.label, selected && styles.labelActive]}>{tab}</Text>
            <View style={[styles.underline, selected && styles.underlineActive]} />
          </TouchableOpacity>;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border },
  row: { paddingHorizontal: Spacing.md, gap: 22 },
  tab: { height: 42, justifyContent: 'center', position: 'relative' },
  label: { color: Colors.textLight, fontFamily: Fonts.bodySemibold, fontSize: 13 },
  labelActive: { color: Colors.text, fontFamily: Fonts.bodyBold },
  underline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, borderRadius: 3, backgroundColor: 'transparent' },
  underlineActive: { backgroundColor: Colors.accent },
});
