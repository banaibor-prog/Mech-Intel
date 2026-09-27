import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Avatar from '../Avatar';
import AppIcon from '../AppIcon';
import MeghalayaSky from '../brand/MeghalayaSky';
import KhasiWeave from '../brand/KhasiWeave';
import { Colors, Gradients } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

interface Props {
  topInset: number;
  displayName: string;
  photoURL?: string;
  location: string;
  jobs: number;
  pros: number;
  hotspots: number;
  search: string;
  onSearchChange: (value: string) => void;
  onLocationPress: () => void;
  onNotificationsPress: () => void;
  onFilterPress: () => void;
}

function timeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const HERO_BODY = 372;

/** Home hero: dusk over the Khasi hills with the greeting, live numbers and search. */
export default function HomeHeader({
  topInset,
  displayName,
  photoURL,
  location,
  jobs,
  pros,
  hotspots,
  search,
  onSearchChange,
  onLocationPress,
  onNotificationsPress,
  onFilterPress,
}: Props) {
  const firstName = displayName.trim().split(' ')[0] || 'there';
  const place = location.split(',')[0];
  return (
    <View style={styles.container}>
      <MeghalayaSky height={topInset + HERO_BODY} style={styles.sky} />

      <View style={[styles.inner, { paddingTop: topInset + 12 }]}>
        <View style={styles.identityRow}>
          <LinearGradient colors={['#22D3EE', Colors.accent, Colors.community]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Avatar name={displayName} photoURL={photoURL} size={40} />
            </View>
          </LinearGradient>
          <View style={styles.identityCopy}>
            <Text style={styles.eyebrow}>{timeOfDay()} · Khublei</Text>
            <Text style={styles.greeting} numberOfLines={1}>
              {firstName}
            </Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" style={styles.glassButton} onPress={onNotificationsPress}>
            <AppIcon name="bell" size={19} color={Colors.white} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Change location, currently ${location}`}
          style={styles.locationPill}
          onPress={onLocationPress}
          activeOpacity={0.85}>
          <View style={styles.liveDot} />
          <Text style={styles.location} numberOfLines={1}>
            {location}
          </Text>
          <AppIcon name="chevronDown" size={14} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <Text style={styles.headline}>
          <Text style={styles.headlineNumber}>{jobs}</Text> open {jobs === 1 ? 'job' : 'jobs'}
          {'\n'}around {place}
        </Text>

        <View style={styles.statRow}>
          <Stat value={pros} label="pros available" />
          <View style={styles.statDivider} />
          <Stat value={hotspots} label={hotspots === 1 ? 'hotspot' : 'hotspots'} />
          <View style={styles.statDivider} />
          <Stat value="24/7" label="live map" />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <AppIcon name="search" size={19} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search electricians, tutors, people…"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
          />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open the live work map" onPress={onFilterPress} activeOpacity={0.85}>
            <LinearGradient colors={[...Gradients.brand]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.mapButton}>
              <AppIcon name="map" size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <KhasiWeave height={7} opacity={0.35} bordered={false} style={styles.weave} />
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background },
  sky: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  inner: { paddingHorizontal: 20, paddingBottom: 92 },
  identityRow: { flexDirection: 'row', alignItems: 'center' },
  avatarRing: { width: 48, height: 48, borderRadius: 24, padding: 2 },
  avatarInner: { flex: 1, borderRadius: 22, borderWidth: 2, borderColor: '#0B153F', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, marginLeft: 12 },
  eyebrow: { color: 'rgba(224,231,255,0.72)', fontFamily: Fonts.bodySemibold, fontSize: 12, letterSpacing: 0.3 },
  greeting: { color: Colors.white, fontFamily: Fonts.display, fontSize: 21, letterSpacing: -0.3, marginTop: 1 },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F43F5E',
    borderWidth: 1.5,
    borderColor: '#172463',
  },
  locationPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    maxWidth: '85%',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D399' },
  location: { color: Colors.white, fontFamily: Fonts.bodySemibold, fontSize: 12.5, flexShrink: 1 },
  headline: { color: Colors.white, fontFamily: Fonts.display, fontSize: 31, lineHeight: 37, letterSpacing: -0.8, marginTop: 18 },
  headlineNumber: { color: '#67E8F9' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  stat: { paddingRight: 14 },
  statValue: { color: Colors.white, fontFamily: Fonts.display, fontSize: 17 },
  statLabel: { color: 'rgba(224,231,255,0.66)', fontFamily: Fonts.bodyMedium, fontSize: 11, marginTop: 1 },
  statDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.16)', marginRight: 14 },
  searchWrap: { marginTop: -28, paddingHorizontal: Spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 6,
    height: 58,
    shadowColor: '#0B153F',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  searchInput: { flex: 1, color: Colors.text, fontFamily: Fonts.body, fontSize: 15, paddingVertical: 0 },
  mapButton: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  weave: { marginTop: 18, alignSelf: 'center', width: '50%' },
});
