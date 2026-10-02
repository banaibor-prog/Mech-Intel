import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AppIcon from '../../components/AppIcon';
import Button from '../../components/Button';
import GycLoader from '../../components/GycLoader';
import {
  AdminGate,
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
import { deleteReviewAsAdmin, getNames, listReviews } from '../../services/adminService';
import { ProfileReview } from '../../types/models';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminReviews'>;
type Filter = 'low' | 'all';

export default function AdminReviewsScreen(props: Props) {
  return (
    <AdminGate>
      <Reviews {...props} />
    </AdminGate>
  );
}

function Reviews({ navigation }: Props) {
  const actor = useAdminActor();
  const [prompt, ask] = usePrompt();
  const [reviews, setReviews] = useState<ProfileReview[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await listReviews();
      setReviews(next);
      setNames(await getNames(next.map((r) => r.targetUid)));
    } catch {
      setReviews([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (reviews ?? []).filter((r) => {
      if (filter === 'low' && r.rating > 2) return false;
      if (!term) return true;
      return `${r.comment} ${r.reviewerName} ${names[r.targetUid] ?? ''} ${r.projectTitle ?? ''}`.toLowerCase().includes(term);
    });
  }, [reviews, names, search, filter]);

  const remove = async (review: ProfileReview) => {
    if (!actor) return;
    const reason = await ask({
      title: 'Delete this review?',
      message: 'Only remove reviews that are abusive, fake or about the wrong person. The trust score is recalculated.',
      confirmLabel: 'Delete',
      destructive: true,
      withReason: true,
    });
    if (reason === null) return;
    setBusyId(review.id);
    try {
      await deleteReviewAsAdmin(actor, review, reason);
      await load();
    } catch (e: any) {
      Alert.alert('Action failed', e?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (!reviews) {
    return (
      <View style={styles.center}>
        <GycLoader size={90} label="Loading reviews" />
      </View>
    );
  }

  const low = reviews.filter((r) => r.rating <= 2).length;

  return (
    <>
      {prompt}
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={visible}
        keyExtractor={(r) => r.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.accent} colors={[Colors.accent]} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchField value={search} onChangeText={setSearch} placeholder="Search text, reviewer or person" />
            <Segments
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All', count: reviews.length },
                { value: 'low', label: '1–2 stars', count: low },
              ]}
            />
          </View>
        }
        ListEmptyComponent={<EmptyNote text={search ? 'No reviews match your search.' : 'No reviews yet.'} />}
        renderItem={({ item }) => (
          <RowCard>
            <View style={styles.rowTop}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <AppIcon key={i} name="star" size={13} color={i <= item.rating ? Colors.text : Colors.borderStrong} filled={i <= item.rating} />
                ))}
              </View>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.comment}>{item.comment}</Text>
            <Text style={styles.meta}>
              {item.reviewerName}
              {'  →  '}
              <Text style={styles.link} onPress={() => navigation.navigate('AdminUser', { uid: item.targetUid })}>
                {names[item.targetUid] ?? 'Member'}
              </Text>
              {item.projectTitle ? ` · ${item.projectTitle}` : ''}
            </Text>
            <RowActions>
              <Button title="Reviewer" size="sm" variant="outline" onPress={() => navigation.navigate('AdminUser', { uid: item.reviewerUid })} style={styles.flex} />
              <Button title="Delete review" size="sm" variant="dark" onPress={() => remove(item)} disabled={busyId === item.id} style={styles.flex} />
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
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  stars: { flexDirection: 'row', gap: 2 },
  time: { marginLeft: 'auto', color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11.5 },
  comment: { color: Colors.text, fontFamily: Fonts.body, fontSize: 14, lineHeight: 20, marginTop: 8 },
  meta: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12.5, marginTop: 8 },
  link: { color: Colors.accent, fontFamily: Fonts.bodySemibold },
});
