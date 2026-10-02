import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import GycLoader from '../../components/GycLoader';
import {
  AdminGate,
  Badge,
  EmptyNote,
  RowCard,
  SectionLabel,
  StatTile,
  formatDate,
  timeAgo,
  useAdminActor,
  usePrompt,
} from '../../components/admin/AdminUI';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { AdminUserDetail, getAdminUserDetail, setProviderVerified, setUserAdmin, setUserSuspended } from '../../services/adminService';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminUser'>;

export default function AdminUserScreen(props: Props) {
  return (
    <AdminGate>
      <UserDetail {...props} />
    </AdminGate>
  );
}

const STATUS_TONE = { pending: 'warning', accepted: 'success', declined: 'danger', cancelled: 'neutral', completed: 'info' } as const;

function UserDetail({ navigation, route }: Props) {
  const { uid } = route.params;
  const actor = useAdminActor();
  const [prompt, ask] = usePrompt();
  const [detail, setDetail] = useState<AdminUserDetail | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetail(await getAdminUserDetail(uid));
    } catch {
      setDetail(null);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e: any) {
      Alert.alert('Action failed', e?.message ?? 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (detail === undefined) {
    return (
      <View style={styles.center}>
        <GycLoader size={90} label="Loading user" />
      </View>
    );
  }
  if (!detail || !actor) {
    return <EmptyNote text="This user could not be found." />;
  }

  const { user, provider, trust, posts, bookings, reportsAgainst, reportsFiled } = detail;
  const isSelf = user.uid === actor.uid;
  const verified = !!provider?.verifications?.includes('identity');
  const openReports = reportsAgainst.filter((r) => !r.status || r.status === 'open').length;

  const toggleSuspend = async () => {
    if (user.suspended) {
      const ok = await ask({ title: `Restore ${user.displayName}?`, message: 'They will be able to post, book and apply again.', confirmLabel: 'Restore' });
      if (ok !== null) run(() => setUserSuspended(actor, user, false));
      return;
    }
    const reason = await ask({
      title: `Suspend ${user.displayName}?`,
      message: 'They will see this reason and lose the ability to post, book, apply, review or report. Their jobs and profile are hidden from the feed and map.',
      confirmLabel: 'Suspend',
      destructive: true,
      withReason: true,
    });
    if (reason !== null) run(() => setUserSuspended(actor, user, true, reason));
  };

  const toggleAdmin = async () => {
    const granting = !user.isAdmin;
    const ok = await ask({
      title: granting ? `Make ${user.displayName} an admin?` : `Remove admin from ${user.displayName}?`,
      message: granting ? 'Admins can suspend users, hide content and change app settings.' : 'They will lose access to the admin console.',
      confirmLabel: granting ? 'Make admin' : 'Remove admin',
      destructive: !granting,
    });
    if (ok !== null) run(() => setUserAdmin(actor, user, granting));
  };

  const toggleVerified = async () => {
    if (!provider) return;
    const ok = await ask({
      title: verified ? 'Remove verified badge?' : `Verify ${user.displayName}?`,
      message: verified ? 'The verified badge will disappear from their profile.' : 'Only verify after checking their identity (e.g. Aadhaar or a trade licence).',
      confirmLabel: verified ? 'Remove badge' : 'Verify',
      destructive: verified,
    });
    if (ok !== null) run(() => setProviderVerified(actor, provider, user.displayName, !verified));
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {prompt}
      <View style={styles.card}>
        <View style={styles.identity}>
          <Avatar name={user.displayName || '?'} photoURL={user.photoURL} size={60} />
          <View style={styles.flex}>
            <Text style={styles.name}>{user.displayName || 'Unnamed user'}</Text>
            <Text style={styles.meta}>{user.email || 'No email'}</Text>
            {user.phone ? <Text style={styles.meta}>{user.phone}</Text> : null}
            <View style={styles.badges}>
              {user.isAdmin ? <Badge label="Admin" tone="info" /> : null}
              {provider ? <Badge label={verified ? 'Verified provider' : 'Provider'} tone={verified ? 'success' : 'neutral'} /> : null}
              {user.suspended ? <Badge label="Suspended" tone="danger" /> : null}
              {isSelf ? <Badge label="You" /> : null}
            </View>
          </View>
        </View>
        <View style={styles.facts}>
          <Fact label="Joined" value={formatDate(user.createdAt)} />
          <Fact label="Area" value={provider?.location || user.location || '—'} />
          <Fact label="User ID" value={user.uid} />
        </View>
        {user.suspended ? (
          <View style={styles.suspension}>
            <Text style={styles.suspensionTitle}>Suspended {timeAgo(user.suspendedAt)}</Text>
            <Text style={styles.suspensionText}>{user.suspendedReason || 'No reason given'}</Text>
          </View>
        ) : null}
      </View>

      <SectionLabel title="Actions" />
      <View style={styles.actions}>
        <Button
          title={user.suspended ? 'Restore account' : 'Suspend account'}
          variant={user.suspended ? 'primary' : 'dark'}
          onPress={toggleSuspend}
          disabled={busy || isSelf}
        />
        {provider ? (
          <Button title={verified ? 'Remove verified badge' : 'Verify provider'} variant="outline" icon="verified" onPress={toggleVerified} disabled={busy} />
        ) : null}
        <Button title={user.isAdmin ? 'Remove admin access' : 'Make admin'} variant="outline" onPress={toggleAdmin} disabled={busy || isSelf} />
        <Button title="View public profile" variant="ghost" onPress={() => navigation.navigate('PublicProfile', { uid: user.uid })} />
      </View>
      {isSelf ? <Text style={styles.note}>You can't suspend yourself or remove your own admin access.</Text> : null}

      <SectionLabel title="Trust" />
      <View style={styles.grid}>
        <StatTile label="Trust score" value={trust?.trustScore ?? 50} />
        <StatTile label="Rating" value={trust?.reviewCount ? `${trust.reviewAverage.toFixed(1)}★` : 'New'} hint={`${trust?.reviewCount ?? 0} reviews`} />
        <StatTile label="Open reports" value={openReports} hint={`${reportsAgainst.length} total`} onPress={() => navigation.navigate('AdminReports')} />
        <StatTile label="Reports filed" value={reportsFiled.length} />
      </View>

      <SectionLabel title={`Reports about them (${reportsAgainst.length})`} />
      {reportsAgainst.length === 0 ? (
        <EmptyNote text="No reports or blocks." />
      ) : (
        reportsAgainst.slice(0, 10).map((r) => (
          <RowCard key={r.id}>
            <View style={styles.rowTop}>
              <Badge label={r.type === 'report' ? 'Report' : 'Block'} tone={r.type === 'report' ? 'danger' : 'neutral'} />
              <Badge label={r.status ?? 'open'} tone={!r.status || r.status === 'open' ? 'warning' : 'neutral'} />
              <Text style={styles.time}>{timeAgo(r.createdAt)}</Text>
            </View>
            <Text style={styles.rowTitle}>{r.reason}</Text>
            {r.note ? <Text style={styles.rowText}>{r.note}</Text> : null}
          </RowCard>
        ))
      )}

      <SectionLabel title={`Jobs posted (${posts.length})`} />
      {posts.length === 0 ? (
        <EmptyNote text="No jobs posted." />
      ) : (
        posts.slice(0, 10).map((p) => (
          <RowCard key={p.id} onPress={() => navigation.navigate('PostDetail', { postId: p.id })}>
            <View style={styles.rowTop}>
              <Badge label={p.skill} />
              {p.hidden ? <Badge label="Hidden" tone="danger" /> : null}
              <Text style={styles.time}>{timeAgo(p.createdAt)}</Text>
            </View>
            <Text style={styles.rowTitle}>{p.title}</Text>
          </RowCard>
        ))
      )}

      <SectionLabel title={`Bookings (${bookings.length})`} />
      {bookings.length === 0 ? (
        <EmptyNote text="No bookings." />
      ) : (
        bookings.slice(0, 10).map((b) => (
          <RowCard key={b.id}>
            <View style={styles.rowTop}>
              <Badge label={b.status} tone={STATUS_TONE[b.status]} />
              <Text style={styles.rowMeta}>{b.providerUid === user.uid ? 'As provider' : 'As customer'}</Text>
              <Text style={styles.time}>{timeAgo(b.createdAt)}</Text>
            </View>
            <Text style={styles.rowTitle}>{b.skill}</Text>
            <Text style={styles.rowText} numberOfLines={2}>
              {b.message}
            </Text>
          </RowCard>
        ))
      )}
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={1} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  flex: { flex: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: 22, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  identity: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  name: { color: Colors.text, fontFamily: Fonts.display, fontSize: 19 },
  meta: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, marginTop: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  facts: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  factLabel: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 12.5 },
  factValue: { flex: 1, textAlign: 'right', color: Colors.text, fontFamily: Fonts.bodySemibold, fontSize: 12.5 },
  suspension: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: Colors.errorSoft },
  suspensionTitle: { color: Colors.error, fontFamily: Fonts.bodyBold, fontSize: 13 },
  suspensionText: { color: Colors.text, fontFamily: Fonts.body, fontSize: 13, marginTop: 2 },
  actions: { gap: 8 },
  note: { color: Colors.textMuted, fontFamily: Fonts.body, fontSize: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14, marginTop: 8 },
  rowText: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 18, marginTop: 3 },
  rowMeta: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12 },
  time: { marginLeft: 'auto', color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11.5 },
});
