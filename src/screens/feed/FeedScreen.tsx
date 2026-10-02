import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { listFeedPostsPage, listProviderCards, toggleLike, FeedPost, ProviderCard } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from '../../navigation/types';
import HomeHeader from '../../components/home/HomeHeader';
import QuickActions from '../../components/home/QuickActions';
import FeedTabs, { HomeFeedTab } from '../../components/home/FeedTabs';
import ProviderCarousel from '../../components/home/ProviderCarousel';
import CategoryScroller, { HomeCategory } from '../../components/home/CategoryScroller';
import SectionHeader from '../../components/home/SectionHeader';
import JobCard from '../../components/home/JobCard';
import HomeEmptyState from '../../components/home/HomeEmptyState';
import HomeSkeleton from '../../components/home/HomeSkeleton';
import LiveMapCard, { MapTeaserPin } from '../../components/home/LiveMapCard';
import AnnouncementBanner from '../../components/home/AnnouncementBanner';
import { useAppConfig } from '../../context/AppConfigContext';
import { categoryStyle } from '../../constants/Categories';
import { useTabBarSpace } from '../../constants/Layout';
import { zoneForPoint } from '../../data/meghalayaZones';

/** Zones where posted jobs for a skill outnumber the pros offering it, busiest gap first. */
function findHotspots(posts: FeedPost[], providers: ProviderCard[]) {
  const demand = new Map<string, number>();
  const supply = new Map<string, number>();
  for (const post of posts) {
    const zone = post.coords ? zoneForPoint(post.coords) : null;
    if (zone) demand.set(`${zone.id}|${post.skill}`, (demand.get(`${zone.id}|${post.skill}`) ?? 0) + 1);
  }
  for (const provider of providers) {
    const zone = provider.coords ? zoneForPoint(provider.coords) : null;
    if (!zone) continue;
    for (const skill of provider.skills) supply.set(`${zone.id}|${skill}`, (supply.get(`${zone.id}|${skill}`) ?? 0) + 1);
  }
  const gaps = [...demand.entries()]
    .map(([key, count]) => ({ key, gap: count - (supply.get(key) ?? 0) }))
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap - a.gap);
  const zones = new Set(gaps.map((g) => g.key.split('|')[0]));
  const top = gaps[0];
  let headline: string | undefined;
  if (top) {
    const [zoneId, skill] = top.key.split('|');
    const zone = posts.map((p) => (p.coords ? zoneForPoint(p.coords) : null)).find((z) => z?.id === zoneId);
    const noun = skill.replace(/^Freelance /, '').toLowerCase();
    headline = `${zone?.name ?? 'A nearby zone'} needs ${noun}s`;
  }
  return { count: zones.size, headline };
}

type Props = NativeStackScreenProps<HomeStackParamList, 'Feed'>;
type MixedFeedItem = { kind: 'job'; post: FeedPost } | { kind: 'professionals'; id: string };

function urgent(post: FeedPost): boolean {
  return /urgent|today|immediately|asap|emergency/i.test(`${post.title} ${post.description}`);
}

export default function FeedScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
  const config = useAppConfig();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [providers, setProviders] = useState<ProviderCard[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<HomeFeedTab>('For You');
  const [selectedSkill, setSelectedSkill] = useState<string>();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const goToTab = (name: 'ExploreTab' | 'NetworkTab') => navigation.getParent()?.navigate(name);

  const loadFirstPage = useCallback(async (skill?: string) => {
    const [postPage, providerCards] = await Promise.all([listFeedPostsPage(skill), listProviderCards(skill)]);
    setPosts(postPage.posts);
    setProviders(providerCards);
    cursorRef.current = postPage.cursor;
    setHasMore(postPage.hasMore);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadFirstPage(selectedSkill).finally(() => setLoading(false));
  }, [loadFirstPage, selectedSkill]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadFirstPage(selectedSkill);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursorRef.current || activeTab === 'Following') return;
    setLoadingMore(true);
    try {
      const page = await listFeedPostsPage(selectedSkill, cursorRef.current);
      setPosts((current) => [...current, ...page.posts.filter((next) => !current.some((existing) => existing.id === next.id))]);
      cursorRef.current = page.cursor;
      setHasMore(page.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [activeTab, hasMore, loadingMore, selectedSkill]);

  const toggleSaved = async (post: FeedPost) => {
    if (!user) return;
    const wasSaved = savedIds.has(post.id);
    setSavedIds((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(post.id); else next.add(post.id);
      return next;
    });
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, likeCount: Math.max(0, item.likeCount + (wasSaved ? -1 : 1)) } : item));
    try {
      await toggleLike(post.id, user.uid, post.isMock);
    } catch {
      setSavedIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.add(post.id); else next.delete(post.id);
        return next;
      });
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, likeCount: Math.max(0, item.likeCount + (wasSaved ? 1 : -1)) } : item));
    }
  };

  const filteredProviders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return providers;
    return providers.filter((provider) => `${provider.displayName} ${provider.skills.join(' ')}`.toLowerCase().includes(term));
  }, [providers, search]);

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (activeTab === 'Nearby' && !post.location) return false;
      if (activeTab === 'Urgent' && !urgent(post)) return false;
      if (activeTab === 'Following') return false;
      if (!term) return true;
      return `${post.title} ${post.description} ${post.skill} ${post.location ?? ''} ${post.authorName}`.toLowerCase().includes(term);
    });
  }, [activeTab, posts, search]);

  const mixedFeed = useMemo<MixedFeedItem[]>(() => {
    const items: MixedFeedItem[] = filteredPosts.map((post) => ({ kind: 'job', post }));
    if (items.length > 2 && filteredProviders.length > 2) items.splice(2, 0, { kind: 'professionals', id: 'top-professionals' });
    return items;
  }, [filteredPosts, filteredProviders.length]);

  const selectCategory = (category: HomeCategory) => {
    setSelectedSkill((current) => current === category.skill ? undefined : category.skill);
    setSearch('');
    setActiveTab('For You');
  };

  const hotspots = useMemo(() => findHotspots(posts, providers), [posts, providers]);
  const mapPins = useMemo<MapTeaserPin[]>(() => {
    const pins: MapTeaserPin[] = [];
    const pros = providers.filter((p) => p.photoURL);
    const jobs = posts.filter((p) => p.authorPhotoURL);
    for (let i = 0; pins.length < 6 && (i < pros.length || i < jobs.length); i++) {
      const pro = pros[i];
      const job = jobs[i];
      if (pro) pins.push({ id: `pro:${pro.uid}`, name: pro.displayName, photoURL: pro.photoURL, color: categoryStyle(pro.skills[0]).color, kind: 'pro' });
      if (job && pins.length < 6) pins.push({ id: `job:${job.id}`, name: job.authorName, photoURL: job.authorPhotoURL, color: categoryStyle(job.skill).color, kind: 'job' });
    }
    return pins;
  }, [posts, providers]);

  if (loading) return <HomeSkeleton />;

  const zone = profile?.lastCoords ? zoneForPoint(profile.lastCoords) : null;
  const location = zone ? `${zone.name}, ${zone.area}` : profile?.location || 'Meghalaya';
  const recommendationTitle = selectedSkill ? `${selectedSkill} opportunities` : search ? 'Search results' : activeTab === 'Urgent' ? 'Urgent jobs nearby' : activeTab === 'Nearby' ? 'Jobs near you' : 'Jobs for you';

  return (
    <View style={styles.screen}>
      <FlatList
        data={mixedFeed}
        keyExtractor={(item) => item.kind === 'job' ? item.post.id : item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace + 8 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.45}
        ListHeaderComponent={<View>
          <HomeHeader
            topInset={insets.top}
            displayName={profile?.displayName || user?.displayName || 'Member'}
            photoURL={profile?.photoURL}
            location={location}
            jobs={posts.length}
            pros={providers.filter((p) => p.available).length}
            hotspots={hotspots.count}
            search={search}
            onSearchChange={setSearch}
            onLocationPress={() => navigation.navigate('Discover')}
            onProfilePress={() => navigation.navigate('Profile')}
            onNotificationsPress={() => goToTab('NetworkTab')}
            onAdminPress={profile?.isAdmin ? () => navigation.navigate('AdminHome') : undefined}
            onFilterPress={() => goToTab('ExploreTab')}
          />
          {config.announcement.active && (config.announcement.title || config.announcement.message) ? (
            <AnnouncementBanner title={config.announcement.title} message={config.announcement.message} tone={config.announcement.tone} />
          ) : null}
          <QuickActions
            onPostJob={() => navigation.navigate('CreatePost')}
            onFindPros={() => navigation.navigate('Discover')}
            onOpenMap={() => goToTab('ExploreTab')}
            onOfferService={() => navigation.navigate('Profile')}
          />
          <LiveMapCard jobs={posts.length} pros={providers.length} pins={mapPins} hotspot={hotspots.headline} onOpen={() => goToTab('ExploreTab')} />
          <CategoryScroller selected={selectedSkill} onSelect={selectCategory} onSeeAll={() => goToTab('ExploreTab')} />
          <ProviderCarousel providers={filteredProviders} onSeeAll={() => navigation.navigate('Discover')} onSelect={(uid) => navigation.navigate('PublicProfile', { uid })} />
          <View style={styles.feedHeading}>
            <SectionHeader title={recommendationTitle} subtitle={filteredPosts.length ? `${filteredPosts.length} jobs picked for you` : undefined} />
          </View>
          <FeedTabs active={activeTab} onChange={setActiveTab} />
          <View style={styles.feedGap} />
        </View>}
        ListEmptyComponent={<HomeEmptyState title={activeTab === 'Following' ? 'Your following feed is ready' : 'No matching jobs yet'} message={activeTab === 'Following' ? 'Open professional profiles and build your network to personalize this feed.' : selectedSkill ? 'Try another service category or clear the current filter.' : 'Explore services or post what you need.'} actionLabel={activeTab === 'Following' ? 'Explore professionals' : 'Post a job'} onAction={activeTab === 'Following' ? () => navigation.navigate('Discover') : () => navigation.navigate('CreatePost')} />}
        ListFooterComponent={loadingMore ? <View style={styles.loadingMore}><View style={styles.loadingLine} /><Text style={styles.loadingText}>Finding more opportunities...</Text></View> : <View style={styles.footerSpace} />}
        renderItem={({ item }) => item.kind === 'professionals' ? <View style={styles.midSection}><ProviderCarousel title="Top rated" providers={[...filteredProviders].sort((a, b) => b.trustScore - a.trustScore).slice(0, 6)} onSeeAll={() => navigation.navigate('Discover')} onSelect={(uid) => navigation.navigate('PublicProfile', { uid })} /></View> : <JobCard post={item.post} saved={savedIds.has(item.post.id)} onSave={() => toggleSaved(item.post)} onOpen={() => navigation.navigate('PostDetail', { postId: item.post.id })} onApply={() => navigation.navigate('PostDetail', { postId: item.post.id })} onAuthor={() => navigation.navigate('PublicProfile', { uid: item.post.authorUid })} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1 },
  feedHeading: { paddingHorizontal: Spacing.md, marginTop: 22 },
  feedGap: { height: 16 },
  midSection: { marginTop: -16, marginBottom: 18 },
  loadingMore: { alignItems: 'center', paddingVertical: 20 },
  loadingLine: { width: 32, height: 3, borderRadius: 2, backgroundColor: Colors.accent },
  loadingText: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11, marginTop: 8 },
  footerSpace: { height: 10 },
});
