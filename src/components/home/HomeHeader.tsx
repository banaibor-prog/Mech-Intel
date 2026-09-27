import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Avatar from '../Avatar';
import AppIcon from '../AppIcon';
import CloudHills from '../brand/CloudHills';
import { Colors, Gradients } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

interface Props {
  topInset: number;
  displayName: string;
  photoURL?: string;
  location: string;
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

export default function HomeHeader({ topInset, displayName, photoURL, location, search, onSearchChange, onLocationPress, onNotificationsPress, onFilterPress }: Props) {
  const firstName = displayName.trim().split(' ')[0] || 'there';
  return (
    <View style={[styles.container, { paddingTop: topInset + Spacing.sm }]}>
      <CloudHills height={topInset + 200} style={styles.backdrop} />
      <View style={styles.identityRow}>
        <View style={styles.avatarRing}>
          <Avatar name={displayName} photoURL={photoURL} size={44} />
        </View>
        <View style={styles.identityCopy}>
          <Text style={styles.eyebrow}>{timeOfDay().toUpperCase()}</Text>
          <Text style={styles.greeting} numberOfLines={1}>
            Khublei, {firstName}
          </Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" style={styles.iconButton} onPress={onNotificationsPress}>
          <AppIcon name="bell" size={20} color={Colors.text} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Change location, currently ${location}`}
        style={styles.locationPill}
        onPress={onLocationPress}
        activeOpacity={0.85}>
        <AppIcon name="location" size={14} color={Colors.accent} />
        <Text style={styles.location} numberOfLines={1}>
          {location}
        </Text>
        <AppIcon name="chevronDown" size={13} color={Colors.textLight} />
      </TouchableOpacity>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <AppIcon name="search" size={19} color={Colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search services, skills or people"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search services, skills or people"
          />
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open the work map" onPress={onFilterPress} activeOpacity={0.85}>
          <LinearGradient colors={[...Gradients.brand]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.filterButton}>
            <AppIcon name="map" size={20} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, paddingBottom: 14 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0 },
  identityRow: { flexDirection: 'row', alignItems: 'center' },
  avatarRing: { padding: 2, borderRadius: 26, backgroundColor: Colors.white },
  identityCopy: { flex: 1, marginLeft: 11 },
  eyebrow: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1.8 },
  greeting: { color: Colors.text, fontFamily: Fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: { position: 'absolute', right: 11, top: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.error, borderWidth: 1.5, borderColor: Colors.white },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 12,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  location: { color: Colors.text, fontFamily: Fonts.bodySemibold, fontSize: 12.5, maxWidth: 230 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 58 },
  searchBox: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  searchInput: { flex: 1, color: Colors.text, fontFamily: Fonts.body, fontSize: 14.5, paddingVertical: 0 },
  filterButton: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
