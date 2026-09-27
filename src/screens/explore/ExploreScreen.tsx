import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import Avatar from '../../components/Avatar';
import GycLoader from '../../components/GycLoader';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useMode } from '../../context/ModeContext';
import {
  FeedPost,
  listFeedPostsPage,
  listProviderCardsPage,
  ProviderCard,
} from '../../services/dataService';
import { SKILL_CATEGORIES } from '../../types/models';
import { ExploreStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ExploreStackParamList, 'Explore'>;

type Kind = 'providers' | 'jobs';

const FILTERS = ['All', ...SKILL_CATEGORIES];
const TAB_BAR_CLEARANCE = 96;

export default function ExploreScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { mode } = useMode();

  // Mode picks the sensible default, but the user can browse either side.
  const [kind, setKind] = useState<Kind>(mode === 'working' ? 'jobs' : 'providers');
  const [skill, setSkill] = useState('All');
  const [search, setSearch] = useState('');
  const [providers, setProviders] = useState<ProviderCard[]>([]);
  const [jobs, setJobs] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  useEffect(() => {
    setKind(mode === 'working' ? 'jobs' : 'providers');
  }, [mode]);

  const loadFirstPage = useCallback(async (nextKind: Kind, nextSkill: string) => {
    const filter = nextSkill === 'All' ? undefined : nextSkill;
    if (nextKind === 'providers') {
      const page = await listProviderCardsPage(filter);
      setProviders(page.cards);
      cursorRef.current = page.cursor;
      setHasMore(page.hasMore);
    } else {
      const page = await listFeedPostsPage(filter);
      setJobs(page.posts);
      cursorRef.current = page.cursor;
      setHasMore(page.hasMore);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadFirstPage(kind, skill).finally(() => setLoading(false));
  }, [kind, skill, loadFirstPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFirstPage(kind, skill);
    setRefreshing(false);
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    try {
      const filter = skill === 'All' ? undefined : skill;
      if (kind === 'providers') {
        const page = await listProviderCardsPage(filter, cursorRef.current);
        setProviders((prev) => [...prev, ...page.cards]);
        cursorRef.current = page.cursor;
        setHasMore(page.hasMore);
      } else {
        const page = await listFeedPostsPage(filter, cursorRef.current);
        setJobs((prev) => [...prev, ...page.posts]);
        cursorRef.current = page.cursor;
        setHasMore(page.hasMore);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, kind, skill]);

  // Search only covers pages already loaded — it does not re-query Firestore.
  const term = search.trim().toLowerCase();
  const visibleProviders = useMemo(
    () =>
      !term
        ? providers
        : providers.filter((p) =>
            `${p.displayName} ${p.skills.join(' ')} ${p.bio}`.toLowerCase().includes(term)
          ),
    [providers, term]
  );
  const visibleJobs = useMemo(
    () =>
      !term
        ? jobs
        : jobs.filter((j) =>
            `${j.title} ${j.description} ${j.skill} ${j.authorName}`.toLowerCase().includes(term)
          ),
    [jobs, term]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Explore</Text>

        <View style={styles.segment}>
          {(['providers', 'jobs'] as const).map((value) => (
            <TouchableOpacity
              key={value}
              style={[styles.segmentBtn, kind === value && styles.segmentBtnActive]}
              activeOpacity={0.8}
              onPress={() => setKind(value)}>
              <Text style={[styles.segmentText, kind === value && styles.segmentTextActive]}>
                {value === 'providers' ? 'Providers' : 'Jobs'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={kind === 'providers' ? 'Search skills, names…' : 'Search jobs…'}
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, skill === item && styles.chipActive]}
              onPress={() => setSkill(item)}
              activeOpacity={0.7}>
              <Text style={[styles.chipText, skill === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <GycLoader size={72} style={styles.loader} />
      ) : kind === 'providers' ? (
        <FlatList
          data={visibleProviders}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.ink} /> : null}
          ListEmptyComponent={<Text style={styles.emptyText}>No providers found.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PublicProfile', { uid: item.uid })}>
              <Avatar name={item.displayName} photoURL={item.photoURL} size={50} />
              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.displayName}
                  </Text>
                  {item.hourlyRate ? (
                    <Text style={styles.rate}>₹{item.hourlyRate}/hr</Text>
                  ) : null}
                </View>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.skills.join(' · ')}
                </Text>
                <Text style={styles.cardBio} numberOfLines={2}>
                  {item.bio}
                </Text>
                <Text style={styles.trustText}>
                  Trust {item.trustScore} / {item.reviewCount} reviews
                </Text>
                {item.location ? <Text style={styles.location}>📍 {item.location}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={visibleJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.ink} /> : null}
          ListEmptyComponent={<Text style={styles.emptyText}>No jobs found.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.budget ? <Text style={styles.rate}>₹{item.budget}</Text> : null}
                </View>
                <View style={styles.jobTag}>
                  <Text style={styles.jobTagText}>{item.skill}</Text>
                </View>
                <Text style={styles.cardBio} numberOfLines={2}>
                  {item.description}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('PublicProfile', { uid: item.authorUid })}
                >
                  <Text style={styles.location}>
                    {item.authorName} / Trust {item.authorTrustScore}
                  </Text>
                </TouchableOpacity>
                {item.location ? <Text style={styles.location}>📍 {item.location}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerBlock: { paddingHorizontal: Spacing.lg },
  title: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 11,
    padding: 3,
    marginBottom: Spacing.sm + 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm - 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: Colors.surface },
  segmentText: {
    fontFamily: Fonts.bodySemibold,
    fontSize: 13,
    color: Colors.textLight,
  },
  segmentTextActive: { color: Colors.text },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    paddingHorizontal: Spacing.md - 2,
  },
  searchIcon: { fontSize: 17, color: Colors.textMuted, marginRight: Spacing.xs + 2 },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm + 3,
    fontFamily: Fonts.body,
    fontSize: 14.5,
    color: Colors.text,
  },
  filterWrap: { marginTop: Spacing.md },
  filterContent: { paddingHorizontal: Spacing.lg, gap: Spacing.xs + 2 },
  chip: {
    paddingHorizontal: Spacing.md - 2,
    paddingVertical: Spacing.xs + 3,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    marginRight: Spacing.xs + 2,
  },
  chipActive: { backgroundColor: Colors.ink },
  chipText: { fontFamily: Fonts.bodySemibold, fontSize: 12.5, color: Colors.textLight },
  chipTextActive: { color: Colors.white },
  loader: { marginTop: Spacing.xl },
  listContent: { padding: Spacing.lg, paddingTop: Spacing.md },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: Spacing.md - 2,
    marginBottom: Spacing.sm + 4,
  },
  cardBody: { flex: 1, marginLeft: Spacing.sm + 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardTitle: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  rate: { fontFamily: Fonts.displaySemibold, fontSize: 13.5, color: Colors.accent },
  cardMeta: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.accent,
    marginTop: 3,
  },
  jobTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginTop: 5,
  },
  jobTagText: { fontFamily: Fonts.bodySemibold, fontSize: 11, color: Colors.accent },
  cardBio: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textLight,
    marginTop: 5,
  },
  trustText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11.5,
    color: Colors.success,
    marginTop: 5,
  },
  location: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: Colors.textMuted,
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.textLight,
  },
});
