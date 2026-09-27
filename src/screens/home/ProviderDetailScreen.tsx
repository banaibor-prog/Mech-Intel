import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import AppIcon, { AppIconName } from '../../components/AppIcon';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import GycLoader from '../../components/GycLoader';
import ContourBackdrop from '../../components/brand/ContourBackdrop';
import GycLogo from '../../components/brand/GycLogo';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import TextField from '../../components/ui/TextField';
import { categoryStyle } from '../../constants/Categories';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { zoneForPoint } from '../../data/meghalayaZones';
import { getProviderProfile, getUserProfile, createBooking } from '../../services/dataService';
import { ProviderProfile, UserProfile } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

// Registered in the Home, Explore and Network stacks, so it is typed by the
// shape it actually uses rather than bound to one param list.
interface Props {
  route: { params: { uid: string } };
  navigation: { goBack: () => void };
}

const AVATAR = 84;

export default function ProviderDetailScreen({ route, navigation }: Props) {
  const { uid } = route.params;
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, u] = await Promise.all([getProviderProfile(uid), getUserProfile(uid)]);
      setProvider(p);
      setOwnerProfile(u);
      setSkill(p?.skills[0] ?? null);
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
        skill: skill ?? provider?.skills[0] ?? 'General',
        message: message.trim(),
        ...(preferredDate.trim() ? { preferredDate: preferredDate.trim() } : {}),
      });
      Alert.alert('Request sent', 'Your booking request has been sent. You can follow it in Bookings.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Failed to send request', e.message ?? 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <GycLoader size={110} label="Loading provider" />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.center}>
        <GycLogo size={84} />
        <Text style={styles.emptyText}>This provider is no longer available.</Text>
      </View>
    );
  }

  const name = ownerProfile?.displayName ?? 'Provider';
  const primary = categoryStyle(provider.skills[0]);
  const zone = provider.coords ? zoneForPoint(provider.coords) : null;
  const place = provider.location || (zone ? `${zone.name}, ${zone.area}` : undefined);
  const available = provider.available && provider.availabilityStatus !== 'away';

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.banner}>
          <ContourBackdrop style={styles.bannerSky} />
        </View>
        <View style={styles.heroBody}>
          <View style={[styles.avatarRing, { borderColor: Colors.border }]}>
            <Avatar name={name} photoURL={ownerProfile?.photoURL} size={AVATAR} />
            <View style={[styles.catBadge, { backgroundColor: Colors.ink }]}>
              <AppIcon name={primary.icon} size={13} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.name}>{name}</Text>
          {provider.headline ? <Text style={styles.headline}>{provider.headline}</Text> : null}
          <View style={[styles.statusPill, { backgroundColor: available ? Colors.successSoft : Colors.surfaceAlt }]}>
            <View style={[styles.statusDot, { backgroundColor: available ? Colors.success : Colors.textMuted }]} />
            <Text style={[styles.statusText, { color: available ? Colors.success : Colors.textLight }]}>
              {available ? 'Available for work' : 'Currently away'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {provider.hourlyRate ? <Stat icon="briefcase" value={`₹${provider.hourlyRate}`} label="per hour" /> : null}
        {provider.yearsExperience ? <Stat icon="clock" value={`${provider.yearsExperience}+`} label="years exp." /> : null}
        {place ? <Stat icon="location" value={zone?.name ?? 'Nearby'} label={place} /> : null}
      </View>

      <Text style={styles.sectionTitle}>Skills</Text>
      <View style={styles.chipWrap}>
        {provider.skills.map((s) => {
          const cat = categoryStyle(s);
          return <Chip key={s} label={s} icon={cat.icon} />;
        })}
      </View>

      {provider.bio ? (
        <>
          <Text style={styles.sectionTitle}>About</Text>
          <Card>
            <Text style={styles.bio}>{provider.bio}</Text>
          </Card>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Request a booking</Text>
      <Card>
        {provider.skills.length > 1 ? (
          <>
            <Text style={styles.label}>What do you need?</Text>
            <View style={styles.chipWrap}>
              {provider.skills.map((s) => {
                const cat = categoryStyle(s);
                return <Chip key={s} label={s} icon={cat.icon} active={skill === s} onPress={() => setSkill(s)} />;
              })}
            </View>
          </>
        ) : null}
        <TextField
          label="Message"
          containerStyle={provider.skills.length > 1 ? styles.gapTop : null}
          placeholder="Describe the job, the place and anything they should bring…"
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
        />
        <TextField
          label="Preferred date"
          containerStyle={styles.gapTop}
          placeholder="Optional, e.g. Saturday morning"
          value={preferredDate}
          onChangeText={setPreferredDate}
        />
        <Button title="Send request" icon="arrowRight" onPress={handleRequestBooking} loading={submitting} style={styles.gapTop} />
      </Card>
    </ScrollView>
  );
}

function Stat({ icon, value, label }: { icon: AppIconName; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <AppIcon name={icon} size={16} color={Colors.accent} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, paddingBottom: Spacing.xxl, backgroundColor: Colors.background, flexGrow: 1 },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  emptyText: { fontFamily: Fonts.bodyMedium, color: Colors.textLight, marginTop: Spacing.md },

  hero: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  banner: { height: 80, overflow: 'hidden' },
  bannerSky: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroBody: { alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  avatarRing: {
    marginTop: -(AVATAR / 2 + 6),
    borderWidth: 3,
    borderRadius: AVATAR / 2 + 6,
    padding: 2,
    backgroundColor: Colors.surface,
  },
  catBadge: {
    position: 'absolute',
    right: -2,
    bottom: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 23, fontFamily: Fonts.display, color: Colors.text, marginTop: 10, textAlign: 'center', letterSpacing: -0.4 },
  headline: { fontSize: 13.5, fontFamily: Fonts.bodySemibold, color: Colors.textLight, marginTop: 3, textAlign: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, marginTop: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusText: { fontFamily: Fonts.bodyBold, fontSize: 12 },

  statsRow: { flexDirection: 'row', marginTop: Spacing.md, gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 15, fontFamily: Fonts.display, color: Colors.text, marginTop: 6 },
  statLabel: { fontSize: 11, fontFamily: Fonts.bodyMedium, color: Colors.textLight, marginTop: 2 },

  sectionTitle: { fontSize: 18, fontFamily: Fonts.display, color: Colors.text, marginTop: Spacing.lg, marginBottom: 10, letterSpacing: -0.3 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bio: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textLight, lineHeight: 21 },
  label: { fontFamily: Fonts.bodySemibold, fontSize: 13, color: Colors.textLight, marginBottom: 8 },
  gapTop: { marginTop: Spacing.md },
});
