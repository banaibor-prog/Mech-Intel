import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Avatar from '../../components/Avatar';
import AppIcon from '../../components/AppIcon';
import Button from '../../components/Button';
import GycLoader from '../../components/GycLoader';
import {
  AdminGate,
  Badge,
  EmptyNote,
  RowActions,
  RowCard,
  Segments,
  timeAgo,
  useAdminActor,
  usePrompt,
} from '../../components/admin/AdminUI';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { getNames, setReportStatus, subscribeToReports } from '../../services/adminService';
import { TrustAction } from '../../types/models';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminReports'>;
type Filter = 'open' | 'resolved' | 'dismissed' | 'all';

const isOpen = (r: TrustAction) => !r.status || r.status === 'open';

export default function AdminReportsScreen(props: Props) {
  return (
    <AdminGate>
      <Reports {...props} />
    </AdminGate>
  );
}

function Reports({ navigation }: Props) {
  const actor = useAdminActor();
  const [prompt, ask] = usePrompt();
  const [reports, setReports] = useState<TrustAction[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>('open');
  const [busyId, setBusyId] = useState<string | null>(null);
  // Resolved names survive snapshots so a stream of reports doesn't refetch the same users.
  const nameCache = useRef<Record<string, string>>({});

  useEffect(
    () =>
      subscribeToReports(async (next) => {
        const missing = next.flatMap((r) => [r.reporterUid, r.targetUid]).filter((uid) => !nameCache.current[uid]);
        if (missing.length) Object.assign(nameCache.current, await getNames(missing));
        setNames({ ...nameCache.current });
        setReports(next);
      }),
    [],
  );

  const counts = useMemo(() => {
    const all = reports ?? [];
    return {
      open: all.filter(isOpen).length,
      resolved: all.filter((r) => r.status === 'resolved').length,
      dismissed: all.filter((r) => r.status === 'dismissed').length,
      all: all.length,
    };
  }, [reports]);

  const visible = useMemo(
    () => (reports ?? []).filter((r) => (filter === 'all' ? true : filter === 'open' ? isOpen(r) : r.status === filter)),
    [reports, filter],
  );

  const decide = async (report: TrustAction, status: 'resolved' | 'dismissed') => {
    if (!actor) return;
    const note = await ask({
      title: status === 'resolved' ? 'Mark as resolved?' : 'Dismiss this report?',
      message:
        status === 'resolved'
          ? 'Use this once you have acted on it (e.g. warned or suspended the user, hidden the job).'
          : 'Dismissed reports no longer count against the reported user’s trust score.',
      confirmLabel: status === 'resolved' ? 'Resolve' : 'Dismiss',
      withReason: true,
      placeholder: 'Note for the activity log (optional)',
    });
    if (note === null) return;
    setBusyId(report.id);
    try {
      await setReportStatus(actor, report, status, note);
    } catch (e: any) {
      Alert.alert('Action failed', e?.message ?? 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (!reports) {
    return (
      <View style={styles.center}>
        <GycLoader size={90} label="Loading reports" />
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
        keyExtractor={(r) => r.id}
        ListHeaderComponent={
          <Segments
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'open', label: 'Open', count: counts.open },
              { value: 'resolved', label: 'Resolved', count: counts.resolved },
              { value: 'dismissed', label: 'Dismissed', count: counts.dismissed },
              { value: 'all', label: 'All', count: counts.all },
            ]}
          />
        }
        ListHeaderComponentStyle={styles.header}
        ListEmptyComponent={<EmptyNote text={filter === 'open' ? 'No open reports. Nice and quiet.' : 'Nothing here.'} />}
        renderItem={({ item }) => (
          <RowCard>
            <View style={styles.rowTop}>
              <Badge label={item.type === 'report' ? 'Report' : 'Block'} tone={item.type === 'report' ? 'danger' : 'neutral'} />
              <Badge label={item.status ?? 'open'} tone={isOpen(item) ? 'warning' : item.status === 'resolved' ? 'success' : 'neutral'} />
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.reason}>{item.reason}</Text>
            {item.note ? <Text style={styles.note}>{item.note}</Text> : null}

            <View style={styles.parties}>
              <Party label="Reported by" name={names[item.reporterUid]} onPress={() => navigation.navigate('AdminUser', { uid: item.reporterUid })} />
              <AppIcon name="arrowRight" size={15} color={Colors.textMuted} />
              <Party label="About" name={names[item.targetUid]} onPress={() => navigation.navigate('AdminUser', { uid: item.targetUid })} />
            </View>

            {item.resolution && !isOpen(item) ? (
              <Text style={styles.resolution}>
                {item.status === 'resolved' ? 'Resolved' : 'Dismissed'} {timeAgo(item.resolvedAt)} · {item.resolution}
              </Text>
            ) : null}

            {isOpen(item) ? (
              <RowActions>
                <Button title="Open user" size="sm" variant="outline" onPress={() => navigation.navigate('AdminUser', { uid: item.targetUid })} style={styles.flex} />
                <Button title="Dismiss" size="sm" variant="outline" onPress={() => decide(item, 'dismissed')} disabled={busyId === item.id} style={styles.flex} />
                <Button title="Resolve" size="sm" variant="dark" onPress={() => decide(item, 'resolved')} disabled={busyId === item.id} style={styles.flex} />
              </RowActions>
            ) : null}
          </RowCard>
        )}
      />
    </>
  );
}

function Party({ label, name, onPress }: { label: string; name?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.party} onPress={onPress} activeOpacity={0.8}>
      <Avatar name={name || '?'} size={28} />
      <View style={styles.flex}>
        <Text style={styles.partyLabel}>{label}</Text>
        <Text style={styles.partyName} numberOfLines={1}>
          {name ?? '…'}
        </Text>
      </View>
    </TouchableOpacity>
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
  reason: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 15, marginTop: 8 },
  note: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 18, marginTop: 3 },
  parties: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  party: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  partyLabel: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11 },
  partyName: { color: Colors.text, fontFamily: Fonts.bodySemibold, fontSize: 13 },
  resolution: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 10 },
});
