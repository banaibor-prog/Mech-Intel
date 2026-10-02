import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AppIcon, { AppIconName } from '../../components/AppIcon';
import GycLoader from '../../components/GycLoader';
import { AdminGate, EmptyNote, RowCard, SearchField, formatDate, timeAgo } from '../../components/admin/AdminUI';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { listAdminLogs } from '../../services/adminService';
import { AdminLog } from '../../types/models';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminActivity'>;

const ICONS: Record<AdminLog['targetType'], AppIconName> = {
  user: 'user',
  provider: 'verified',
  post: 'briefcase',
  booking: 'calendar',
  report: 'bell',
  review: 'star',
  config: 'layers',
};

export default function AdminActivityScreen(props: Props) {
  return (
    <AdminGate>
      <Activity {...props} />
    </AdminGate>
  );
}

function Activity({ navigation }: Props) {
  const [logs, setLogs] = useState<AdminLog[] | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLogs(await listAdminLogs());
    } catch {
      setLogs([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs ?? [];
    return (logs ?? []).filter((l) => `${l.summary} ${l.note ?? ''} ${l.actorName} ${l.action}`.toLowerCase().includes(term));
  }, [logs, search]);

  if (!logs) {
    return (
      <View style={styles.center}>
        <GycLoader size={90} label="Loading activity" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(l) => l.id}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.accent} colors={[Colors.accent]} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <SearchField value={search} onChangeText={setSearch} placeholder="Search actions, admins or notes" />
          <Text style={styles.hint}>Every change made in the admin console is recorded here and can't be edited or deleted.</Text>
        </View>
      }
      ListEmptyComponent={<EmptyNote text="No admin actions yet." />}
      renderItem={({ item }) => (
        <RowCard onPress={item.targetType === 'user' || item.targetType === 'provider' ? () => navigation.navigate('AdminUser', { uid: item.targetId }) : undefined}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <AppIcon name={ICONS[item.targetType] ?? 'layers'} size={16} color={Colors.text} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.summary}>{item.summary}</Text>
              {item.note ? <Text style={styles.note}>“{item.note}”</Text> : null}
              <Text style={styles.meta}>
                {item.actorName} · {timeAgo(item.createdAt)} · {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
        </RowCard>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: { marginBottom: Spacing.md },
  hint: { color: Colors.textMuted, fontFamily: Fonts.body, fontSize: 12, marginTop: 8 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  icon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  summary: { color: Colors.text, fontFamily: Fonts.bodySemibold, fontSize: 14 },
  note: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, marginTop: 3 },
  meta: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11.5, marginTop: 5 },
});
