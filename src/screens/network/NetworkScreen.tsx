import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Avatar from '../../components/Avatar';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';
import { CONNECTION_LABELS, subscribeToNetwork } from '../../services/networkService';
import { Connection } from '../../types/models';
import { NetworkStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<NetworkStackParamList, 'Network'>;

const TAB_BAR_CLEARANCE = 96;

function timeAgo(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
}

export default function NetworkScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToNetwork(user.uid, (next) => {
      setConnections(next);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.ink} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + Spacing.lg,
        },
      ]}
      data={connections}
      keyExtractor={(item) => item.uid}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>My Network</Text>
          <Text style={styles.subtitle}>
            {connections.length > 0
              ? `${connections.length} ${connections.length === 1 ? 'person' : 'people'} you've worked with`
              : 'People you hire and work with appear here'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PublicProfile', { uid: item.uid })}>
          <Avatar name={item.displayName} photoURL={item.photoURL} size={46} />
          <View style={styles.rowBody}>
            <Text style={styles.name} numberOfLines={1}>
              {item.displayName}
            </Text>
            <Text style={styles.relation} numberOfLines={1}>
              {item.kinds.map((k) => CONNECTION_LABELS[k]).join(' · ')}
            </Text>
            {item.context ? (
              <Text style={styles.context} numberOfLines={1}>
                {item.context}
              </Text>
            ) : null}
          </View>
          <Text style={styles.time}>{timeAgo(item.lastInteractionAt)}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No connections yet</Text>
          <Text style={styles.emptyText}>
            When you hire someone or apply for a job, they'll show up here so you can find them
            again easily.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  title: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: Spacing.md - 2,
    marginBottom: Spacing.sm + 2,
  },
  rowBody: { flex: 1, marginLeft: Spacing.sm + 2 },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.text,
  },
  relation: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
  },
  context: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11.5,
    color: Colors.accent,
    marginTop: 2,
  },
  time: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  emptyTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
