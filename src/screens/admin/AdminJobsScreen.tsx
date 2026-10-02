import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../../components/Button';
import GycLoader from '../../components/GycLoader';
import {
  AdminGate,
  Badge,
  EmptyNote,
  RowActions,
  RowCard,
  SearchField,
  Segments,
  timeAgo,
  useAdminActor,
  usePrompt,
} from '../../components/admin/AdminUI';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { deletePostAsAdmin, getNames, listPosts, setPostHidden } from '../../services/adminService';
import { Post } from '../../types/models';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminJobs'>;
type Filter = 'live' | 'hidden' | 'all';

export default function AdminJobsScreen(props: Props) {
  return (
    <AdminGate>
      <Jobs {...props} />
    </AdminGate>
  );
}

function Jobs({ navigation }: Props) {
  const actor = useAdminActor();
  const [prompt, ask] = usePrompt();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('live');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await listPosts();
      setPosts(next);
      setNames(await getNames(next.map((p) => p.authorUid)));
    } catch {
      setPosts([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (posts ?? []).filter((p) => {
      if (filter === 'live' && p.hidden) return false;
      if (filter === 'hidden' && !p.hidden) return false;
      if (!term) return true;
      return `${p.title} ${p.description} ${p.skill} ${p.location ?? ''} ${names[p.authorUid] ?? ''}`.toLowerCase().includes(term);
    });
  }, [posts, names, search, filter]);

  const act = async (post: Post, fn: () => Promise<void>) => {
    setBusyId(post.id);
    try {
      await fn();
      await load();
    } catch (e: any) {
      Alert.alert('Action failed', e?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const hide = async (post: Post) => {
    if (!actor) return;
    const reason = await ask({
      title: 'Hide this job?',
      message: 'It disappears from the feed and map but is kept so you can restore it.',
      confirmLabel: 'Hide job',
      destructive: true,
      withReason: true,
    });
    if (reason !== null) act(post, () => setPostHidden(actor, post, true, reason));
  };

  const restore = async (post: Post) => {
    if (!actor) return;
    const ok = await ask({ title: 'Restore this job?', message: 'It will show in the feed and on the map again.', confirmLabel: 'Restore' });
    if (ok !== null) act(post, () => setPostHidden(actor, post, false));
  };

  const remove = async (post: Post) => {
    if (!actor) return;
    const reason = await ask({
      title: 'Delete this job permanently?',
      message: 'This cannot be undone. Prefer hiding unless the content is illegal or abusive.',
      confirmLabel: 'Delete',
      destructive: true,
      withReason: true,
    });
    if (reason !== null) act(post, () => deletePostAsAdmin(actor, post, reason));
  };

  if (!posts) {
    return (
      <View style={styles.center}>
        <GycLoader size={90} label="Loading jobs" />
      </View>
    );
  }

  const hiddenCount = posts.filter((p) => p.hidden).length;

  return (
    <>
      {prompt}
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={visible}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.accent} colors={[Colors.accent]} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchField value={search} onChangeText={setSearch} placeholder="Search title, skill, area or poster" />
            <Segments
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'live', label: 'Live', count: posts.length - hiddenCount },
                { value: 'hidden', label: 'Hidden', count: hiddenCount },
                { value: 'all', label: 'All', count: posts.length },
              ]}
            />
          </View>
        }
        ListEmptyComponent={<EmptyNote text={search ? 'No jobs match your search.' : 'No jobs here.'} />}
        renderItem={({ item }) => (
          <RowCard onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
            <View style={styles.rowTop}>
              <Badge label={item.skill} />
              {item.hidden ? <Badge label="Hidden" tone="danger" /> : <Badge label="Live" tone="success" />}
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.meta}>
              {names[item.authorUid] ?? 'Unknown'} · {item.location || 'No area'} · {item.budget ? `₹${item.budget}` : 'No budget'} · {item.applicantCount} applied
            </Text>
            {item.hidden && item.hiddenReason ? <Text style={styles.reason}>Hidden: {item.hiddenReason}</Text> : null}
            <RowActions>
              {item.hidden ? (
                <Button title="Restore" size="sm" variant="outline" onPress={() => restore(item)} disabled={busyId === item.id} style={styles.flex} />
              ) : (
                <Button title="Hide" size="sm" variant="outline" onPress={() => hide(item)} disabled={busyId === item.id} style={styles.flex} />
              )}
              <Button title="Delete" size="sm" variant="dark" onPress={() => remove(item)} disabled={busyId === item.id} style={styles.flex} />
            </RowActions>
          </RowCard>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: { marginBottom: Spacing.md },
  flex: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { marginLeft: 'auto', color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11.5 },
  title: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 15, marginTop: 8 },
  desc: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 18, marginTop: 3 },
  meta: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 8 },
  reason: { color: Colors.error, fontFamily: Fonts.bodySemibold, fontSize: 12, marginTop: 6 },
});
