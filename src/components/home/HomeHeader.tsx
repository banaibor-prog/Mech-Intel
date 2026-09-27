import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Avatar from '../Avatar';
import AppIcon from '../AppIcon';
import ContourBackdrop from '../brand/ContourBackdrop';
import { Colors } from '../../constants/Colors';
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
  onProfilePress: () => void;
  onNotificationsPress: () => void;
  onFilterPress: () => void;
}

function timeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const HERO_BODY = 356;

/** Home hero: greeting, live numbers and search on an ink panel with faint contour lines. */
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
  onProfilePress,
  onNotificationsPress,
  onFilterPress,
}: Props) {
  const firstName = displayName.trim().split(' ')[0] || 'there';
  const place = location.split(',')[0];
  return (
    <View style={styles.container}>
      <ContourBackdrop height={topInset + HERO_BODY} style={styles.sky} />

      <View style={[styles.inner, { paddingTop: topInset + 12 }]}>
        <View style={styles.identityRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            style={styles.avatarRing}
            onPress={onProfilePress}
            activeOpacity={0.8}>
            <Avatar name={displayName} photoURL={photoURL} size={42} />
          </TouchableOpacity>
          <View style={styles.identityCopy}>
            <Text style={styles.eyebrow}>{timeOfDay()}</Text>
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
          <AppIcon name="location" size={14} color="rgba(255,255,255,0.75)" />
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
          <Stat value={hotspots} label={hotspots === 1 ? 'zone needs help' : 'zones need help'} />
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
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open the live work map" onPress={onFilterPress} activeOpacity={0.85} style={styles.mapButton}>
            <AppIcon name="map" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
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
  sky: { position: 'absolute', top: 0, left: 0, right: 0, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  inner: { paddingHorizontal: 20, paddingBottom: 76 },
  identityRow: { flexDirection: 'row', alignItems: 'center' },
  avatarRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, marginLeft: 12 },
  eyebrow: { color: 'rgba(255,255,255,0.6)', fontFamily: Fonts.bodyMedium, fontSize: 12.5 },
  greeting: { color: Colors.white, fontFamily: Fonts.display, fontSize: 21, letterSpacing: -0.3, marginTop: 1 },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: Colors.ink,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxWidth: '85%',
  },
  location: { color: Colors.white, fontFamily: Fonts.bodySemibold, fontSize: 12.5, flexShrink: 1 },
  headline: { color: Colors.white, fontFamily: Fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.8, marginTop: 20 },
  headlineNumber: { color: Colors.white },
  statRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  stat: { paddingRight: 14 },
  statValue: { color: Colors.white, fontFamily: Fonts.display, fontSize: 17 },
  statLabel: { color: 'rgba(255,255,255,0.55)', fontFamily: Fonts.bodyMedium, fontSize: 11, marginTop: 1 },
  statDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.14)', marginRight: 14 },
  searchWrap: { marginTop: -29, paddingHorizontal: Spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 6,
    height: 58,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  searchInput: { flex: 1, color: Colors.text, fontFamily: Fonts.body, fontSize: 15, paddingVertical: 0 },
  mapButton: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.ink },
});
