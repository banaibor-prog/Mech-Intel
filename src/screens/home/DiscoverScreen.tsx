import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { categoryStyle } from '../../constants/Categories';
import { zoneForPoint } from '../../data/meghalayaZones';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { listProviderCardsPage, ProviderCard } from '../../services/dataService';
import { SKILL_CATEGORIES } from '../../types/models';
import { HomeStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import AppIcon from '../../components/AppIcon';
import GycLoader from '../../components/GycLoader';
import GycLogo from '../../components/brand/GycLogo';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import ScreenHero from '../../components/ui/ScreenHero';

type Props = NativeStackScreenProps<HomeStackParamList, 'Discover'>;

const FILTERS = ['All', ...SKILL_CATEGORIES];

export default function DiscoverScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [providers, setProviders] = useState<ProviderCard[]>([]);
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = React.useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const loadFirstPage = useCallback(async (skill: string) => {
    const page = await listProviderCardsPage(skill === 'All' ? undefined : skill);
    setProviders(page.cards);
    cursorRef.current = page.cursor;
    setHasMore(page.hasMore);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadFirstPage(selectedSkill).finally(() => setLoading(false));
  }, [selectedSkill, loadFirstPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFirstPage(selectedSkill);
    setRefreshing(false);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    try {
      const skillFilter = selectedSkill === 'All' ? undefined : selectedSkill;
      const page = await listProviderCardsPage(skillFilter, cursorRef.current);
      setProviders((prev) => [...prev, ...page.cards]);
      cursorRef.current = page.cursor;
      setHasMore(page.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, selectedSkill]);

  const filteredProviders = providers.filter((p) => {
    if (!searchText.trim()) return true;
    const haystack = `${p.displayName} ${p.skills.join(' ')} ${p.bio}`.toLowerCase();
    return haystack.includes(searchText.trim().toLowerCase());
  });

  const firstName = profile?.displayName?.split(' ')[0];

  const header = (
    <>
      <ScreenHero
        topInset={insets.top}
        eyebrow={firstName ? `Khublei, ${firstName}` : 'Khublei'}
        title="Find trusted help near you"
        height={150}
        right={
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.roundButton}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <View style={styles.backIcon}>
              <AppIcon name="arrowRight" size={17} color={Colors.text} />
            </View>
          </TouchableOpacity>
        }>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <AppIcon name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search skills, names…"
              placeholderTextColor={Colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('ExploreTab')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Open the live map">
            <View style={styles.mapButton}>
              <AppIcon name="map" size={20} color={Colors.white} />
            </View>
          </TouchableOpacity>
        </View>
      </ScreenHero>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(item) => item}
        style={styles.filterList}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => {
          const cat = item === 'All' ? null : categoryStyle(item);
          return (
            <Chip
              label={item}
              icon={cat?.icon ?? 'layers'}
             
              active={selectedSkill === item}
              onPress={() => setSelectedSkill(item)}
            />
          );
        }}
      />
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={loading ? [] : filteredProviders}
        keyExtractor={(item) => item.uid}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={Colors.accent} /> : null}
        ListEmptyComponent={
          loading ? (
            <GycLoader size={100} style={styles.loader} label="Finding providers" />
          ) : (
            <View style={styles.empty}>
              <GycLogo size={80} />
              <Text style={styles.emptyText}>No providers found. Try a different search or category.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const cat = categoryStyle(item.skills[0]);
          const zone = item.coords ? zoneForPoint(item.coords) : null;
          const place = item.location || (zone ? `${zone.name}, ${zone.area}` : undefined);
          return (
            <TouchableOpacity activeOpacity={0.88} onPress={() => navigation.navigate('PublicProfile', { uid: item.uid })}>
              <Card style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={[styles.avatarRing, { borderColor: Colors.border }]}>
                    <Avatar name={item.displayName} photoURL={item.photoURL} size={52} />
                    <View style={[styles.catBadge, { backgroundColor: Colors.ink }]}>
                      <AppIcon name={cat.icon} size={10} color={Colors.white} />
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.displayName}
                      </Text>
                      {item.hourlyRate ? (
                        <View style={styles.ratePill}>
                          <Text style={styles.rateValue}>₹{item.hourlyRate}</Text>
                          <Text style={styles.rateUnit}>/hr</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.skillText} numberOfLines={1}>
                      {item.skills.join(' · ')}
                    </Text>
                    {item.bio ? (
                      <Text style={styles.bioText} numberOfLines={2}>
                        {item.bio}
                      </Text>
                    ) : null}
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <AppIcon name="star" size={12} color="#F59E0B" />
                        <Text style={styles.metaText}>{item.reviewCount ? item.reviewAverage.toFixed(1) : 'New'}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <AppIcon name="verified" size={12} color={Colors.success} />
                        <Text style={styles.metaText}>Trust {item.trustScore}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <AppIcon name="briefcase" size={12} color={Colors.textMuted} />
                        <Text style={styles.metaText}>{item.completedJobs} jobs</Text>
                      </View>
                    </View>
                    {place ? (
                      <View style={styles.metaItem}>
                        <AppIcon name="location" size={12} color={Colors.textMuted} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {place}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  roundButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backIcon: { transform: [{ rotate: '180deg' }] },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: Spacing.md },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchInput: { flex: 1, color: Colors.text, fontFamily: Fonts.body, paddingVertical: 12, fontSize: 15 },
  mapButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.accent },
  filterList: { flexGrow: 0 },
  filterContent: { paddingHorizontal: Spacing.md, gap: 8, paddingVertical: 4 },
  loader: { alignSelf: 'center', marginTop: Spacing.xl },
  footerLoader: { marginVertical: Spacing.lg },
  listContent: { paddingBottom: Spacing.xxl },
  empty: { alignItems: 'center', paddingTop: Spacing.xl, paddingHorizontal: Spacing.xl },
  emptyText: { textAlign: 'center', color: Colors.textLight, fontFamily: Fonts.bodyMedium, marginTop: Spacing.md },
  card: { marginHorizontal: Spacing.md, marginTop: 10 },
  cardRow: { flexDirection: 'row', paddingLeft: 4 },
  avatarRing: { borderWidth: 2.5, borderRadius: 32, padding: 2, alignSelf: 'flex-start' },
  catBadge: {
    position: 'absolute',
    right: -3,
    bottom: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontFamily: Fonts.display, color: Colors.text, flexShrink: 1, marginRight: Spacing.xs },
  ratePill: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: Colors.accentSoft, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  rateValue: { fontSize: 13.5, fontFamily: Fonts.display, color: Colors.accent },
  rateUnit: { fontSize: 10.5, fontFamily: Fonts.bodyMedium, color: Colors.accent },
  skillText: { fontSize: 12.5, fontFamily: Fonts.bodyBold, marginTop: 3 },
  bioText: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textLight, marginTop: 5, lineHeight: 18 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontSize: 11.5, fontFamily: Fonts.bodySemibold, color: Colors.textLight },
  locationText: { flex: 1, fontSize: 11.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
});
