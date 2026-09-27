import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Avatar from '../Avatar';
import AppIcon from '../AppIcon';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

interface Props {
  displayName: string;
  photoURL?: string;
  location: string;
  search: string;
  onSearchChange: (value: string) => void;
  onLocationPress: () => void;
  onNotificationsPress: () => void;
  onFilterPress: () => void;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeHeader({ displayName, photoURL, location, search, onSearchChange, onLocationPress, onNotificationsPress, onFilterPress }: Props) {
  const firstName = displayName.trim().split(' ')[0] || 'there';
  return (
    <View style={styles.container}>
      <View style={styles.identityRow}>
        <Avatar name={displayName} photoURL={photoURL} size={44} />
        <View style={styles.identityCopy}>
          <Text style={styles.greeting}>{greeting()}, {firstName}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Change location, currently ${location}`} style={styles.locationButton} onPress={onLocationPress}>
            <Text style={styles.location} numberOfLines={1}>{location}</Text>
            <AppIcon name="chevronDown" size={14} color={Colors.textLight} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" style={styles.iconButton} onPress={onNotificationsPress}>
          <AppIcon name="bell" size={21} color={Colors.text} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

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
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Search filters" style={styles.filterButton} onPress={onFilterPress}>
          <AppIcon name="filter" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 12, backgroundColor: Colors.background },
  identityRow: { flexDirection: 'row', alignItems: 'center' },
  identityCopy: { flex: 1, marginLeft: 11 },
  greeting: { color: Colors.text, fontFamily: Fonts.displaySemibold, fontSize: 19, lineHeight: 24 },
  locationButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 28, gap: 3 },
  location: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12, maxWidth: 210 },
  iconButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', right: 10, top: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.error, borderWidth: 1, borderColor: Colors.surface },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  searchBox: { flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 13 },
  searchInput: { flex: 1, color: Colors.text, fontFamily: Fonts.body, fontSize: 14, paddingVertical: 0 },
  filterButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
});
