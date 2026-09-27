import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Avatar from '../../components/Avatar';
import AppIcon from '../../components/AppIcon';
import GycLoader from '../../components/GycLoader';
import GycLogo from '../../components/brand/GycLogo';
import ScreenHero from '../../components/ui/ScreenHero';
import { useTabBarSpace } from '../../constants/Layout';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';
import { CONNECTION_LABELS, subscribeToNetwork } from '../../services/networkService';
import { Connection } from '../../types/models';
import { NetworkStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<NetworkStackParamList, 'Network'>;

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
  const tabBarSpace = useTabBarSpace();
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
        <GycLoader size={96} label="Loading your network…" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ paddingBottom: tabBarSpace + Spacing.lg }}
      data={connections}
      keyExtractor={(item) => item.uid}
      ListHeaderComponent={
        <ScreenHero
          topInset={insets.top}
          eyebrow="Your community"
          title="My Network"
          subtitle={
            connections.length > 0
              ? `${connections.length} ${connections.length === 1 ? 'person' : 'people'} you've worked with`
              : 'People you hire and work with appear here'
          }
        />
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
          <View style={styles.side}>
            <Text style={styles.time}>{timeAgo(item.lastInteractionAt)}</Text>
            <AppIcon name="arrowRight" size={15} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <GycLogo size={96} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: Spacing.md - 2,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm + 2,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  side: { alignItems: 'flex-end', gap: 6, marginLeft: Spacing.sm },
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
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text,
    marginTop: Spacing.md,
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
