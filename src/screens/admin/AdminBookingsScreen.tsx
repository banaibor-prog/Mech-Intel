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
import { cancelBookingAsAdmin, getNames, listBookings } from '../../services/adminService';
import { Booking, BookingStatus } from '../../types/models';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminBookings'>;
type Filter = 'active' | 'completed' | 'closed' | 'all';

const TONE = { pending: 'warning', accepted: 'success', declined: 'danger', cancelled: 'neutral', completed: 'info' } as const;
const ACTIVE: BookingStatus[] = ['pending', 'accepted'];
const CLOSED: BookingStatus[] = ['declined', 'cancelled'];

export default function AdminBookingsScreen(props: Props) {
  return (
    <AdminGate>
      <Bookings {...props} />
    </AdminGate>
  );
}

function Bookings({ navigation }: Props) {
  const actor = useAdminActor();
  const [prompt, ask] = usePrompt();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('active');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await listBookings();
      setBookings(next);
      setNames(await getNames(next.flatMap((b) => [b.providerUid, b.customerUid])));
    } catch {
      setBookings([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(() => {
    const all = bookings ?? [];
    return {
      active: all.filter((b) => ACTIVE.includes(b.status)).length,
      completed: all.filter((b) => b.status === 'completed').length,
      closed: all.filter((b) => CLOSED.includes(b.status)).length,
      all: all.length,
    };
  }, [bookings]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (bookings ?? []).filter((b) => {
      if (filter === 'active' && !ACTIVE.includes(b.status)) return false;
      if (filter === 'completed' && b.status !== 'completed') return false;
      if (filter === 'closed' && !CLOSED.includes(b.status)) return false;
      if (!term) return true;
      return `${b.skill} ${b.message} ${names[b.providerUid] ?? ''} ${names[b.customerUid] ?? ''}`.toLowerCase().includes(term);
    });
  }, [bookings, names, search, filter]);

  const cancel = async (booking: Booking) => {
    if (!actor) return;
    const reason = await ask({
      title: 'Cancel this booking?',
      message: 'Both people will see it as cancelled. Use this for disputes or abuse.',
      confirmLabel: 'Cancel booking',
      destructive: true,
      withReason: true,
    });
    if (reason === null) return;
    setBusyId(booking.id);
    try {
      await cancelBookingAsAdmin(actor, booking, reason);
      await load();
    } catch (e: any) {
      Alert.alert('Action failed', e?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (!bookings) {
    return (
      <View style={styles.center}>
        <GycLoader size={90} label="Loading bookings" />
      </View>
    );
  }

  return (
    <>
      {prompt}
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={visible}
        keyExtractor={(b) => b.id}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.accent} colors={[Colors.accent]} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <SearchField value={search} onChangeText={setSearch} placeholder="Search skill, message or person" />
            <Segments
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'active', label: 'Active', count: counts.active },
                { value: 'completed', label: 'Done', count: counts.completed },
                { value: 'closed', label: 'Closed', count: counts.closed },
                { value: 'all', label: 'All', count: counts.all },
              ]}
            />
          </View>
        }
        ListEmptyComponent={<EmptyNote text={search ? 'No bookings match your search.' : 'No bookings here.'} />}
        renderItem={({ item }) => (
          <RowCard>
            <View style={styles.rowTop}>
              <Badge label={item.status} tone={TONE[item.status]} />
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.title}>{item.skill}</Text>
            <Text style={styles.people}>
              <Text style={styles.link} onPress={() => navigation.navigate('AdminUser', { uid: item.customerUid })}>
                {names[item.customerUid] ?? 'Customer'}
              </Text>
              {'  →  '}
              <Text style={styles.link} onPress={() => navigation.navigate('AdminUser', { uid: item.providerUid })}>
                {names[item.providerUid] ?? 'Provider'}
              </Text>
            </Text>
            <Text style={styles.desc} numberOfLines={3}>
              {item.message}
            </Text>
            {item.preferredDate ? <Text style={styles.meta}>Preferred: {item.preferredDate}</Text> : null}
            {ACTIVE.includes(item.status) ? (
              <RowActions>
                <Button title="Cancel booking" size="sm" variant="outline" onPress={() => cancel(item)} disabled={busyId === item.id} style={styles.flex} />
              </RowActions>
            ) : null}
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
  people: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 13, marginTop: 3 },
  link: { color: Colors.accent, fontFamily: Fonts.bodySemibold },
  desc: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 18, marginTop: 6 },
  meta: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 6 },
});
