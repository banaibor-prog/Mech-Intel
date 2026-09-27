import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../components/AppIcon';
import Button from '../../components/Button';
import GycLogo from '../../components/brand/GycLogo';
import Card from '../../components/ui/Card';
import ScreenHero from '../../components/ui/ScreenHero';
import { categoryStyle } from '../../constants/Categories';
import { Colors } from '../../constants/Colors';
import { useTabBarSpace } from '../../constants/Layout';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToBookingsAsProvider,
  subscribeToBookingsAsCustomer,
  updateBookingStatus,
} from '../../services/dataService';
import { Booking, BookingStatus } from '../../types/models';

const TABS = ['Received', 'Sent'] as const;
type Tab = (typeof TABS)[number];

const STATUS_STYLES: Record<BookingStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: Colors.warningSoft, fg: Colors.warning, label: 'Pending' },
  accepted: { bg: Colors.successSoft, fg: Colors.success, label: 'Accepted' },
  declined: { bg: Colors.errorSoft, fg: Colors.error, label: 'Declined' },
  cancelled: { bg: Colors.surfaceAlt, fg: Colors.textMuted, label: 'Cancelled' },
  completed: { bg: Colors.accentSoft, fg: Colors.accent, label: 'Completed' },
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('Received');
  const [received, setReceived] = useState<Booking[]>([]);
  const [sent, setSent] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubProvider = subscribeToBookingsAsProvider(user.uid, setReceived);
    const unsubCustomer = subscribeToBookingsAsCustomer(user.uid, setSent);
    return () => {
      unsubProvider();
      unsubCustomer();
    };
  }, [user]);

  const handleRespond = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(bookingId, status);
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not update this booking.');
    }
  };

  const data = tab === 'Received' ? received : sent;
  const pendingReceived = received.filter((b) => b.status === 'pending').length;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: tabBarSpace + Spacing.lg }}
        ListHeaderComponent={
          <>
            <ScreenHero
              topInset={insets.top}
              eyebrow="Your work"
              title="Bookings"
              subtitle={
                pendingReceived
                  ? `${pendingReceived} ${pendingReceived === 1 ? 'request needs' : 'requests need'} your reply`
                  : 'Requests you send and receive, in one place'
              }
            />
            <View style={styles.tabRow}>
              {TABS.map((t) => {
                const count = t === 'Received' ? received.length : sent.length;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tabButton, tab === t && styles.tabButtonActive]}
                    onPress={() => setTab(t)}
                    activeOpacity={0.8}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: tab === t }}>
                    <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                    <View style={[styles.countPill, tab === t && styles.countPillActive]}>
                      <Text style={[styles.countText, tab === t && styles.countTextActive]}>{count}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <GycLogo size={90} />
            <Text style={styles.emptyTitle}>{tab === 'Received' ? 'No booking requests yet' : 'No requests sent yet'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'Received'
                ? 'When someone books you, it shows up here. Keep your profile and location up to date to be found on the map.'
                : 'Find a pro on the Explore map or in Discover and send them a request.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusStyle = STATUS_STYLES[item.status];
          const cat = categoryStyle(item.skill);
          return (
            <Card style={styles.card} accent={cat.color}>
              <View style={styles.cardHeader}>
                <View style={[styles.catIcon, { backgroundColor: cat.soft }]}>
                  <AppIcon name={cat.icon} size={18} color={cat.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.skillText}>{item.skill}</Text>
                  <Text style={styles.dateText}>
                    Requested {formatDate(item.createdAt)}
                    {item.preferredDate ? ` · for ${item.preferredDate}` : ''}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.fg }]}>{statusStyle.label}</Text>
                </View>
              </View>
              <Text style={styles.messageText}>{item.message}</Text>

              {tab === 'Received' && item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <Button title="Decline" variant="outline" size="sm" onPress={() => handleRespond(item.id, 'declined')} style={styles.flex} />
                  <Button title="Accept" size="sm" icon="verified" onPress={() => handleRespond(item.id, 'accepted')} style={styles.flex} />
                </View>
              )}

              {tab === 'Sent' && item.status === 'pending' && (
                <Button title="Cancel request" variant="outline" size="sm" onPress={() => handleRespond(item.id, 'cancelled')} style={styles.cancel} />
              )}
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: { fontFamily: Fonts.bodySemibold, fontSize: 14, color: Colors.textLight },
  tabTextActive: { color: Colors.text },
  countPill: { minWidth: 22, paddingHorizontal: 6, borderRadius: 11, backgroundColor: Colors.surface, alignItems: 'center' },
  countPillActive: { backgroundColor: Colors.accent },
  countText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.textLight, lineHeight: 18 },
  countTextActive: { color: Colors.white },
  card: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm + 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  skillText: { fontSize: 15.5, fontFamily: Fonts.display, color: Colors.text },
  dateText: { fontSize: 11.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontFamily: Fonts.bodyBold },
  messageText: { fontSize: 14, fontFamily: Fonts.body, lineHeight: 20, color: Colors.textLight, marginTop: 12 },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cancel: { marginTop: Spacing.md },
  empty: { alignItems: 'center', paddingTop: Spacing.lg, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontFamily: Fonts.display, fontSize: 18, color: Colors.text, marginTop: Spacing.md, textAlign: 'center' },
  emptyText: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, color: Colors.textLight, marginTop: 6, textAlign: 'center' },
});
