import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AppIcon from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import GycLoader from '../../components/GycLoader';
import GycLogo from '../../components/brand/GycLogo';
import KhasiWeave from '../../components/brand/KhasiWeave';
import Card from '../../components/ui/Card';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, subscribeToRecentTrustActions } from '../../services/dataService';
import { TrustAction } from '../../types/models';

interface Row extends TrustAction {
  reporterName: string;
  targetName: string;
}

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ModerationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // Cache resolved names across snapshots so a fast stream of reports doesn't
  // refetch the same reporter/target profile repeatedly.
  const nameCache = useRef(new Map<string, string>());

  useEffect(() => {
    if (!profile?.isAdmin) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToRecentTrustActions(async (actions) => {
      const unresolved = new Set<string>();
      for (const action of actions) {
        if (!nameCache.current.has(action.reporterUid)) unresolved.add(action.reporterUid);
        if (!nameCache.current.has(action.targetUid)) unresolved.add(action.targetUid);
      }
      if (unresolved.size > 0) {
        await Promise.all(
          [...unresolved].map(async (uid) => {
            try {
              const p = await getUserProfile(uid);
              nameCache.current.set(uid, p?.displayName ?? 'Unknown user');
            } catch {
              nameCache.current.set(uid, 'Unknown user');
            }
          })
        );
      }
      setRows(
        actions.map((action) => ({
          ...action,
          reporterName: nameCache.current.get(action.reporterUid) ?? 'Unknown user',
          targetName: nameCache.current.get(action.targetUid) ?? 'Unknown user',
        }))
      );
      setLoading(false);
    });
    return unsubscribe;
  }, [profile?.isAdmin]);

  if (!profile?.isAdmin) {
    return (
      <View style={[styles.container, styles.centered]}>
        <GycLogo size={80} />
        <Text style={styles.deniedText}>You don't have access to this page.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <GycLoader size={100} label="Loading reports" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
      data={rows}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.eyebrow}>COMMUNITY SAFETY</Text>
          <Text style={styles.title}>Moderation queue</Text>
          <Text style={styles.subtitle}>
            {rows.length} recent {rows.length === 1 ? 'report' : 'reports'} and blocks
          </Text>
          <KhasiWeave height={8} opacity={0.35} bordered={false} style={styles.weave} />
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.row} accent={item.type === 'report' ? Colors.error : Colors.textMuted}>
          <View style={styles.rowTop}>
            <View style={[styles.typeBadge, item.type === 'report' ? styles.typeBadgeReport : styles.typeBadgeBlock]}>
              <AppIcon name={item.type === 'report' ? 'bell' : 'close'} size={11} color={item.type === 'report' ? Colors.error : Colors.textLight} />
              <Text style={[styles.typeBadgeText, item.type === 'block' && styles.typeBadgeTextBlock]}>
                {item.type === 'report' ? 'Report' : 'Block'}
              </Text>
            </View>
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
          </View>
          <Text style={styles.reason}>{item.reason}</Text>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
          <View style={styles.parties}>
            <TouchableOpacity
              style={styles.party}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PublicProfile', { uid: item.reporterUid })}>
              <Avatar name={item.reporterName} size={28} />
              <Text style={styles.partyLabel} numberOfLines={1}>
                {item.reporterName}
              </Text>
              <Text style={styles.partyRole}>reporter</Text>
            </TouchableOpacity>
            <AppIcon name="arrowRight" size={16} color={Colors.textMuted} />
            <TouchableOpacity
              style={styles.party}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PublicProfile', { uid: item.targetUid })}>
              <Avatar name={item.targetName} size={28} />
              <Text style={styles.partyLabel} numberOfLines={1}>
                {item.targetName}
              </Text>
              <Text style={styles.partyRole}>target</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <GycLogo size={80} />
          <Text style={styles.emptyText}>No reports or blocks yet. Khublei for keeping it safe.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  deniedText: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textLight,
    fontSize: 14,
    marginTop: Spacing.md,
  },
  content: { padding: Spacing.md },
  header: { marginBottom: Spacing.md },
  eyebrow: { fontFamily: Fonts.bodyBold, fontSize: 10.5, letterSpacing: 2, color: Colors.accent, marginBottom: 2 },
  weave: { marginTop: Spacing.md },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 3,
  },
  row: { marginBottom: Spacing.sm + 4 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  typeBadgeReport: { backgroundColor: Colors.errorSoft },
  typeBadgeBlock: { backgroundColor: Colors.surfaceAlt },
  typeBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.error,
  },
  typeBadgeTextBlock: { color: Colors.textLight },
  time: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  reason: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  note: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textLight,
    marginTop: 4,
  },
  parties: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm + 2,
  },
  party: {
    flex: 1,
    alignItems: 'center',
  },
  partyLabel: {
    fontFamily: Fonts.bodySemibold,
    fontSize: 12,
    color: Colors.text,
    marginTop: 3,
    maxWidth: 110,
  },
  partyRole: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: Colors.textLight,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
