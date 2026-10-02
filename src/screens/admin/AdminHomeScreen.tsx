import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import GycLoader from '../../components/GycLoader';
import { AdminGate, Badge, MenuRow, SectionLabel, StatTile } from '../../components/admin/AdminUI';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useAppConfig } from '../../context/AppConfigContext';
import { DashboardStats, getDashboardStats } from '../../services/adminService';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminHome'>;

/** Admin console overview: live counts plus links to every management area. */
export default function AdminHomeScreen(props: Props) {
  return (
    <AdminGate>
      <Dashboard {...props} />
    </AdminGate>
  );
}

function Dashboard({ navigation }: Props) {
  const config = useAppConfig();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setStats(await getDashboardStats());
  }, []);

  // Loads on first open and refreshes when coming back from a management screen.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!stats) {
    return (
      <View style={styles.center}>
        <GycLoader size={100} label="Loading dashboard" />
      </View>
    );
  }

  const modes = [
    config.maintenance.enabled ? { label: 'Maintenance on', tone: 'danger' as const } : null,
    !config.allowNewPosts ? { label: 'Posting paused', tone: 'warning' as const } : null,
    config.announcement.active ? { label: 'Announcement live', tone: 'info' as const } : null,
    config.showDemoContent ? { label: 'Demo content shown', tone: 'neutral' as const } : null,
  ].filter(Boolean) as { label: string; tone: 'danger' | 'warning' | 'info' | 'neutral' }[];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />}>
      <View style={styles.banner}>
        <Text style={styles.bannerEyebrow}>Got You Covered</Text>
        <Text style={styles.bannerTitle}>
          {stats.openReports ? `${stats.openReports} report${stats.openReports === 1 ? '' : 's'} need review` : 'All clear'}
        </Text>
        <Text style={styles.bannerText}>
          {stats.users} members · {stats.posts} jobs · {stats.bookings} bookings
        </Text>
        {modes.length ? (
          <View style={styles.modes}>
            {modes.map((m) => (
              <Badge key={m.label} label={m.label} tone={m.tone} />
            ))}
          </View>
        ) : null}
      </View>

      <SectionLabel title="People" />
      <View style={styles.grid}>
        <StatTile label="Members" value={stats.users} hint={`+${stats.newUsers7d} this week`} onPress={() => navigation.navigate('AdminUsers')} />
        <StatTile label="Service providers" value={stats.providers} hint={`${stats.availableProviders} available now`} onPress={() => navigation.navigate('AdminUsers', { filter: 'providers' })} />
        <StatTile label="Suspended" value={stats.suspendedUsers} onPress={() => navigation.navigate('AdminUsers', { filter: 'suspended' })} />
        <StatTile label="Reviews" value={stats.reviews} onPress={() => navigation.navigate('AdminReviews')} />
      </View>

      <SectionLabel title="Work" />
      <View style={styles.grid}>
        <StatTile label="Jobs posted" value={stats.posts} hint={`+${stats.newPosts7d} this week`} onPress={() => navigation.navigate('AdminJobs')} />
        <StatTile label="Hidden jobs" value={stats.hiddenPosts} onPress={() => navigation.navigate('AdminJobs')} />
        <StatTile label="Applications" value={stats.applications} />
        <StatTile label="Bookings" value={stats.bookings} hint={`${stats.pendingBookings} pending · ${stats.acceptedBookings} accepted · ${stats.completedBookings} done`} onPress={() => navigation.navigate('AdminBookings')} />
      </View>

      <SectionLabel title="Manage" />
      <MenuRow icon="bell" title="Reports & blocks" subtitle="Review what members flagged" count={stats.openReports} countTone={stats.openReports ? 'danger' : 'neutral'} onPress={() => navigation.navigate('AdminReports')} />
      <MenuRow icon="users" title="Users" subtitle="Suspend, verify, grant admin" count={stats.users} onPress={() => navigation.navigate('AdminUsers')} />
      <MenuRow icon="briefcase" title="Jobs" subtitle="Hide or remove job posts" count={stats.posts} onPress={() => navigation.navigate('AdminJobs')} />
      <MenuRow icon="calendar" title="Bookings" subtitle="Track and cancel bookings" count={stats.bookings} onPress={() => navigation.navigate('AdminBookings')} />
      <MenuRow icon="star" title="Reviews" subtitle="Remove abusive or fake reviews" count={stats.reviews} onPress={() => navigation.navigate('AdminReviews')} />
      <MenuRow icon="layers" title="App settings" subtitle="Announcement, maintenance, posting" onPress={() => navigation.navigate('AdminSettings')} />
      <MenuRow icon="clock" title="Activity log" subtitle="Every action taken by admins" onPress={() => navigation.navigate('AdminActivity')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  banner: { backgroundColor: Colors.ink, borderRadius: 22, padding: 18 },
  bannerEyebrow: { color: 'rgba(255,255,255,0.55)', fontFamily: Fonts.bodySemibold, fontSize: 12 },
  bannerTitle: { color: Colors.white, fontFamily: Fonts.display, fontSize: 22, letterSpacing: -0.4, marginTop: 4 },
  bannerText: { color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.body, fontSize: 13, marginTop: 4 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
