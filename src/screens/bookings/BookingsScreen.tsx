import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../constants/Colors';
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

const STATUS_STYLES: Record<BookingStatus, { bg: string; fg: string }> = {
  pending: { bg: '#FCEFDD', fg: Colors.warning },
  accepted: { bg: '#E4F5EA', fg: Colors.success },
  declined: { bg: '#FBE7E6', fg: Colors.error },
  cancelled: { bg: Colors.surfaceAlt, fg: Colors.textMuted },
  completed: { bg: '#E7E7FD', fg: Colors.accent },
};

export default function BookingsScreen() {
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Bookings</Text>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabButton, tab === t && styles.tabButtonActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {tab === 'Received' ? 'No booking requests yet.' : "You haven't sent any requests yet."}
          </Text>
        }
        renderItem={({ item }) => {
          const statusStyle = STATUS_STYLES[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.skillText}>{item.skill}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.fg }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.messageText}>{item.message}</Text>

              {tab === 'Received' && item.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.declineButton]}
                    onPress={() => handleRespond(item.id, 'declined')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleRespond(item.id, 'accepted')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}

              {tab === 'Sent' && item.status === 'pending' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.declineButton, styles.cancelButton]}
                  onPress={() => handleRespond(item.id, 'cancelled')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.declineText}>Cancel Request</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Spacing.xxl,
  },
  header: {
    fontSize: 26,
    fontFamily: Fonts.display,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.xs + 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textLight,
    fontFamily: Fonts.bodySemibold,
  },
  tabTextActive: {
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl + 80,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 2,
    shadowColor: Colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillText: {
    fontSize: 16,
    fontFamily: Fonts.bodyBold,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: Fonts.bodyBold,
  },
  messageText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.xs + 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.ink,
  },
  declineButton: {
    backgroundColor: Colors.surfaceAlt,
  },
  cancelButton: {
    flex: undefined,
    marginTop: Spacing.sm,
  },
  acceptText: {
    color: Colors.white,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  declineText: {
    color: Colors.error,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textLight,
    marginTop: Spacing.xxl,
  },
});
