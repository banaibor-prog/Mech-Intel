import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/Avatar';
import GycLoader from '../../components/GycLoader';
import { AdminGate, Badge, EmptyNote, RowCard, SearchField, Segments, timeAgo } from '../../components/admin/AdminUI';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { listUsers } from '../../services/adminService';
import { UserProfile } from '../../types/models';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminUsers'>;
type Filter = 'all' | 'providers' | 'admins' | 'suspended';

export default function AdminUsersScreen(props: Props) {
  return (
    <AdminGate>
      <Users {...props} />
    </AdminGate>
  );
}

function Users({ navigation, route }: Props) {
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>(route.params?.filter ?? 'all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await listUsers());
    } catch {
      setUsers([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(() => {
    const all = users ?? [];
    return {
      all: all.length,
      providers: all.filter((u) => u.isProvider).length,
      admins: all.filter((u) => u.isAdmin).length,
      suspended: all.filter((u) => u.suspended).length,
    };
  }, [users]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      if (filter === 'providers' && !u.isProvider) return false;
      if (filter === 'admins' && !u.isAdmin) return false;
      if (filter === 'suspended' && !u.suspended) return false;
      if (!term) return true;
      return `${u.displayName} ${u.email} ${u.phone ?? ''} ${u.location ?? ''} ${u.uid}`.toLowerCase().includes(term);
    });
  }, [users, search, filter]);

  if (!users) {
    return (
      <View style={styles.center}>
        <GycLoader size={90} label="Loading users" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(u) => u.uid}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.accent} colors={[Colors.accent]} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <SearchField value={search} onChangeText={setSearch} placeholder="Search name, email, phone or area" />
          <Segments
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'providers', label: 'Pros', count: counts.providers },
              { value: 'admins', label: 'Admins', count: counts.admins },
              { value: 'suspended', label: 'Suspended', count: counts.suspended },
            ]}
          />
        </View>
      }
      ListEmptyComponent={<EmptyNote text={search ? 'No users match your search.' : 'No users in this group.'} />}
      renderItem={({ item }) => (
        <RowCard onPress={() => navigation.navigate('AdminUser', { uid: item.uid })}>
          <View style={styles.row}>
            <Avatar name={item.displayName || '?'} photoURL={item.photoURL} size={42} />
            <View style={styles.flex}>
              <Text style={styles.name} numberOfLines={1}>
                {item.displayName || 'Unnamed user'}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.email || item.phone || item.uid}
              </Text>
              <View style={styles.badges}>
                {item.isAdmin ? <Badge label="Admin" tone="info" /> : null}
                {item.isProvider ? <Badge label="Provider" /> : null}
                {item.suspended ? <Badge label="Suspended" tone="danger" /> : null}
                <Text style={styles.joined}>Joined {timeAgo(item.createdAt)}</Text>
              </View>
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
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14.5 },
  meta: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12.5, marginTop: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 },
  joined: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11.5 },
});
