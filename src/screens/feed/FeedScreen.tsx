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
import LiveMapCard from '../../components/home/LiveMapCard';
import { useTabBarSpace } from '../../constants/Layout';
import { zoneForPoint } from '../../data/meghalayaZones';

type Props = NativeStackScreenProps<HomeStackParamList, 'Feed'>;
type MixedFeedItem = { kind: 'job'; post: FeedPost } | { kind: 'professionals'; id: string };

function urgent(post: FeedPost): boolean {
  return /urgent|today|immediately|asap|emergency/i.test(`${post.title} ${post.description}`);
}

export default function FeedScreen({ navigation }: Props) {
  const { user, profile } = useAuth();
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

  const goToTab = (name: 'ExploreTab' | 'NetworkTab' | 'ProfileTab') => navigation.getParent()?.navigate(name);

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

  if (loading) return <HomeSkeleton />;

  const zone = profile?.lastCoords ? zoneForPoint(profile.lastCoords) : null;
  const location = zone ? `${zone.name}, ${zone.area}` : profile?.location || 'Meghalaya';
  const recommendationTitle = selectedSkill ? `${selectedSkill} opportunities` : search ? 'Search results' : activeTab === 'Urgent' ? 'Urgent jobs nearby' : activeTab === 'Nearby' ? 'Jobs near you' : 'Recommended for you';

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
            search={search}
            onSearchChange={setSearch}
            onLocationPress={() => navigation.navigate('Discover')}
            onNotificationsPress={() => goToTab('NetworkTab')}
            onFilterPress={() => goToTab('ExploreTab')}
          />
          <QuickActions onPostJob={() => navigation.navigate('CreatePost')} onOfferService={() => goToTab('ProfileTab')} />
          <LiveMapCard jobs={posts.length} pros={providers.length} onOpen={() => goToTab('ExploreTab')} />
          <FeedTabs active={activeTab} onChange={setActiveTab} />
          <ProviderCarousel providers={filteredProviders} onSeeAll={() => navigation.navigate('Discover')} onSelect={(uid) => navigation.navigate('PublicProfile', { uid })} />
          <CategoryScroller selected={selectedSkill} onSelect={selectCategory} onSeeAll={() => goToTab('ExploreTab')} />
          <View style={styles.feedHeading}><SectionHeader title={recommendationTitle} subtitle={filteredPosts.length ? `${filteredPosts.length} opportunities selected for you` : undefined} /></View>
        </View>}
        ListEmptyComponent={<HomeEmptyState title={activeTab === 'Following' ? 'Your following feed is ready' : 'No matching jobs yet'} message={activeTab === 'Following' ? 'Open professional profiles and build your network to personalize this feed.' : selectedSkill ? 'Try another service category or clear the current filter.' : 'Explore services or post what you need.'} actionLabel={activeTab === 'Following' ? 'Explore professionals' : 'Post a job'} onAction={activeTab === 'Following' ? () => navigation.navigate('Discover') : () => navigation.navigate('CreatePost')} />}
        ListFooterComponent={loadingMore ? <View style={styles.loadingMore}><View style={styles.loadingLine} /><Text style={styles.loadingText}>Finding more opportunities...</Text></View> : <View style={styles.footerSpace} />}
        renderItem={({ item }) => item.kind === 'professionals' ? <View style={styles.midSection}><ProviderCarousel providers={[...filteredProviders].sort((a, b) => b.trustScore - a.trustScore).slice(0, 6)} onSeeAll={() => navigation.navigate('Discover')} onSelect={(uid) => navigation.navigate('PublicProfile', { uid })} /></View> : <JobCard post={item.post} saved={savedIds.has(item.post.id)} onSave={() => toggleSaved(item.post)} onOpen={() => navigation.navigate('PostDetail', { postId: item.post.id })} onApply={() => navigation.navigate('PostDetail', { postId: item.post.id })} onAuthor={() => navigation.navigate('PublicProfile', { uid: item.post.authorUid })} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1 },
  feedHeading: { paddingHorizontal: Spacing.md, marginTop: 22, marginBottom: 10 },
  midSection: { marginBottom: 18, paddingVertical: 6, backgroundColor: '#EAF1FC' },
  loadingMore: { alignItems: 'center', paddingVertical: 20 },
  loadingLine: { width: 32, height: 3, borderRadius: 2, backgroundColor: Colors.accent },
  loadingText: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11, marginTop: 8 },
  footerSpace: { height: 10 },
});
