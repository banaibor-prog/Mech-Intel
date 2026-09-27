import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProviderCard as ProviderCardModel } from '../../services/dataService';
import ProviderCard from './ProviderCard';
import SectionHeader from './SectionHeader';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

interface Props {
  providers: ProviderCardModel[];
  onSeeAll: () => void;
  onSelect: (uid: string) => void;
}

export default function ProviderCarousel({ providers, onSeeAll, onSelect }: Props) {
  return <View style={styles.section}>
    <View style={styles.header}><SectionHeader title="Trusted pros near you" subtitle={`${providers.length} people ready to help`} actionLabel="See all" onAction={onSeeAll} /></View>
    {providers.length ? <FlatList data={providers.slice(0, 10)} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item) => item.uid} contentContainerStyle={styles.list} renderItem={({ item }) => <ProviderCard provider={item} onPress={() => onSelect(item.uid)} />} /> : <View style={styles.empty}><Text style={styles.emptyTitle}>Professionals are joining your area</Text><TouchableOpacity onPress={onSeeAll}><Text style={styles.emptyAction}>Expand your search</Text></TouchableOpacity></View>}
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  header: { paddingHorizontal: Spacing.md, marginBottom: 10 },
  list: { paddingHorizontal: Spacing.md, gap: 12, paddingBottom: 6 },
  empty: { marginHorizontal: Spacing.md, minHeight: 96, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 16, justifyContent: 'center' },
  emptyTitle: { color: Colors.text, fontFamily: Fonts.bodySemibold, fontSize: 14 },
  emptyAction: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 12, marginTop: 7 },
});
