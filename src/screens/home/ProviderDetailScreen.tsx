import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import GycLoader from '../../components/GycLoader';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { getProviderProfile, getUserProfile, createBooking } from '../../services/dataService';
import { ProviderProfile, UserProfile } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

// Registered in the Home, Explore and Network stacks, so it is typed by the
// shape it actually uses rather than bound to one param list.
interface Props {
  route: { params: { uid: string } };
  navigation: { goBack: () => void };
}

export default function ProviderDetailScreen({ route, navigation }: Props) {
  const { uid } = route.params;
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, u] = await Promise.all([getProviderProfile(uid), getUserProfile(uid)]);
      setProvider(p);
      setOwnerProfile(u);
      setLoading(false);
    })();
  }, [uid]);

  const handleRequestBooking = async () => {
    if (!user) return;
    if (user.uid === uid) {
      Alert.alert("That's you", "You can't book your own service.");
      return;
    }
    if (!message.trim()) {
      Alert.alert('Add a message', 'Tell them what you need help with.');
      return;
    }
    setSubmitting(true);
    try {
      await createBooking({
        providerUid: uid,
        customerUid: user.uid,
        skill: provider?.skills[0] ?? 'General',
        message: message.trim(),
      });
      Alert.alert('Request sent', 'Your booking request has been sent.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Failed to send request', e.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <GycLoader size={72} style={styles.loader} />;
  }

  if (!provider) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>This provider is no longer available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <Avatar name={ownerProfile?.displayName ?? 'Provider'} photoURL={ownerProfile?.photoURL} size={72} />
        <View style={styles.profileHeaderText}>
          <Text style={styles.name}>{ownerProfile?.displayName ?? 'Provider'}</Text>
          <Text style={styles.skills}>{provider.skills.join(' · ')}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {provider.hourlyRate ? (
          <View style={styles.statPill}>
            <Text style={styles.statValue}>₹{provider.hourlyRate}</Text>
            <Text style={styles.statLabel}>per hour</Text>
          </View>
        ) : null}
        {provider.yearsExperience ? (
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{provider.yearsExperience}+</Text>
            <Text style={styles.statLabel}>years exp.</Text>
          </View>
        ) : null}
        {provider.location ? (
          <View style={styles.statPill}>
            <Text style={styles.statValue}>📍</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              {provider.location}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.bio}>{provider.bio}</Text>

      <Text style={styles.sectionTitle}>Request a booking</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe what you need help with..."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={4}
        value={message}
        onChangeText={setMessage}
      />
      {submitting ? (
        <ActivityIndicator color={Colors.ink} style={styles.spacingTop} />
      ) : (
        <Button title="Send Request" onPress={handleRequestBooking} style={styles.spacingTop} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 80,
    backgroundColor: Colors.background,
    flexGrow: 1,
  },
  loader: {
    flex: 1,
    marginTop: Spacing.xxl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileHeaderText: {
    marginLeft: Spacing.md,
    flexShrink: 1,
  },
  name: {
    fontSize: 22,
    fontFamily: Fonts.display,
    color: Colors.text,
  },
  skills: {
    fontSize: 14,
    color: Colors.accent,
    fontFamily: Fonts.bodySemibold,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontFamily: Fonts.displaySemibold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    color: Colors.textLight,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: Fonts.display,
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  bio: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.textLight,
    lineHeight: 21,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    fontSize: 14,
    fontFamily: Fonts.body,
    minHeight: 100,
    textAlignVertical: 'top',
    color: Colors.text,
  },
  spacingTop: {
    marginTop: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textLight,
    marginTop: Spacing.xxl,
  },
});
