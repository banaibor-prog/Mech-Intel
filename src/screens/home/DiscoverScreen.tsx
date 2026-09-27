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
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Colors, Gradients } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { listProviderCardsPage, ProviderCard } from '../../services/dataService';
import { SKILL_CATEGORIES } from '../../types/models';
import { HomeStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';

type Props = NativeStackScreenProps<HomeStackParamList, 'Discover'>;

const FILTERS = ['All', ...SKILL_CATEGORIES];

export default function DiscoverScreen({ navigation }: Props) {
  const { profile } = useAuth();
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={[...Gradients.hero]} style={styles.hero}>
        <Text style={styles.heroGreeting}>{firstName ? `Hi, ${firstName}` : 'Welcome'}</Text>
        <Text style={styles.heroTitle}>Find trusted help,{'\n'}near you.</Text>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search skills, names..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </LinearGradient>

      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, selectedSkill === item && styles.chipActive]}
              onPress={() => setSelectedSkill(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedSkill === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.ink} />
      ) : (
        <FlatList
          data={filteredProviders}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.ink} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.footerLoader} color={Colors.ink} /> : null
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No providers found. Try a different search.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PublicProfile', { uid: item.uid })}
            >
              <Avatar name={item.displayName} photoURL={item.photoURL} size={52} />
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
                <View style={styles.skillTag}>
                  <Text style={styles.skillTagText} numberOfLines={1}>
                    {item.skills.join(' · ')}
                  </Text>
                </View>
                <Text style={styles.bioText} numberOfLines={2}>
                  {item.bio}
                </Text>
                <Text style={styles.trustText}>
                  Trust {item.trustScore} / {item.reviewCount} reviews / {item.completedJobs} jobs
                </Text>
                {item.location ? (
                  <Text style={styles.locationText}>📍  {item.location}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroGreeting: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: Fonts.bodySemibold,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: Colors.white,
    fontFamily: Fonts.display,
    fontSize: 28,
    marginTop: 6,
    lineHeight: 34,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  searchIcon: {
    color: Colors.textMuted,
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontFamily: Fonts.body,
    paddingVertical: Spacing.sm + 4,
    fontSize: 15,
  },
  filterWrap: {
    height: 52,
    marginTop: Spacing.sm + 2,
    marginBottom: 2,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    height: 36,
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    marginRight: Spacing.xs,
  },
  chipActive: {
    backgroundColor: Colors.ink,
  },
  chipText: {
    color: Colors.textLight,
    fontFamily: Fonts.bodySemibold,
    fontSize: 13,
  },
  chipTextActive: {
    color: Colors.white,
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  footerLoader: {
    marginVertical: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 2,
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardBody: {
    flex: 1,
    marginLeft: Spacing.sm + 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
    flexShrink: 1,
    marginRight: Spacing.xs,
  },
  ratePill: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rateValue: {
    fontSize: 15,
    fontFamily: Fonts.displaySemibold,
    color: Colors.text,
  },
  rateUnit: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textMuted,
  },
  skillTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  skillTagText: {
    fontSize: 12,
    fontFamily: Fonts.bodySemibold,
    color: Colors.accent,
  },
  bioText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.textLight,
    marginTop: Spacing.xs + 2,
    lineHeight: 18,
  },
  trustText: {
    fontSize: 12,
    fontFamily: Fonts.bodyBold,
    color: Colors.success,
    marginTop: Spacing.xs,
  },
  locationText: {
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textLight,
    marginTop: Spacing.xxl,
  },
});
