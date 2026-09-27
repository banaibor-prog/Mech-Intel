import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from '../AppIcon';
import { categoryStyle } from '../../constants/Categories';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { ProviderCard as ProviderCardModel } from '../../services/dataService';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Portrait, photo-led card for a professional, like a profile print on a gallery wall. */
export default function ProviderCard({ provider, onPress }: { provider: ProviderCardModel; onPress: () => void }) {
  const verified = !!provider.verifications?.length;
  const location = provider.location?.split(',')[0] || 'Near you';
  const cat = categoryStyle(provider.skills[0]);
  const rating = provider.reviewCount ? provider.reviewAverage.toFixed(1) : 'New';
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${provider.displayName}'s profile`} style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.photoWrap}>
        {provider.photoURL ? (
          <Image source={{ uri: provider.photoURL }} style={styles.photo} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[cat.color, `${cat.color}99`]} style={[styles.photo, styles.initialsWrap]}>
            <Text style={styles.initials}>{initials(provider.displayName)}</Text>
          </LinearGradient>
        )}
        <LinearGradient colors={['rgba(5,10,31,0)', 'rgba(5,10,31,0.86)']} style={styles.shade} />
        <View style={styles.topRow}>
          <View style={[styles.catChip, { backgroundColor: cat.color }]}>
            <AppIcon name={cat.icon} size={11} color={Colors.white} />
            <Text style={styles.catText} numberOfLines={1}>
              {provider.skills[0] || 'Pro'}
            </Text>
          </View>
          <View style={styles.rating}>
            <AppIcon name="star" size={11} color="#FBBF24" filled />
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>
        <View style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {provider.displayName.split(' ')[0]}
            </Text>
            {verified ? <AppIcon name="verified" size={14} color="#67E8F9" filled /> : null}
          </View>
          <View style={styles.placeRow}>
            {provider.available ? <View style={styles.onlineDot} /> : null}
            <Text style={styles.place} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.rate}>
          {provider.hourlyRate ? `₹${provider.hourlyRate}` : 'Quote'}
          {provider.hourlyRate ? <Text style={styles.rateUnit}>/hr</Text> : null}
        </Text>
        <View style={styles.trust}>
          <AppIcon name="verified" size={11} color={Colors.success} />
          <Text style={styles.trustText}>{provider.trustScore}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 158,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 5,
    borderWidth: 1,
    borderColor: '#EDF1F7',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  photoWrap: { height: 186, borderRadius: 20, overflow: 'hidden', backgroundColor: Colors.surfaceAlt },
  photo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  initialsWrap: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: Colors.white, fontFamily: Fonts.display, fontSize: 40 },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, maxWidth: 104 },
  catText: { color: Colors.white, fontFamily: Fonts.bodyBold, fontSize: 10.5, flexShrink: 1 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(5,10,31,0.55)', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  ratingText: { color: Colors.white, fontFamily: Fonts.bodyBold, fontSize: 10.5 },
  nameBlock: { position: 'absolute', left: 12, right: 12, bottom: 11 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { color: Colors.white, fontFamily: Fonts.display, fontSize: 18, letterSpacing: -0.3, flexShrink: 1 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D399' },
  place: { color: 'rgba(255,255,255,0.82)', fontFamily: Fonts.bodyMedium, fontSize: 11.5, flexShrink: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 9, paddingBottom: 6 },
  rate: { color: Colors.text, fontFamily: Fonts.display, fontSize: 15 },
  rateUnit: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 11 },
  trust: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.successSoft, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  trustText: { color: Colors.success, fontFamily: Fonts.bodyBold, fontSize: 11 },
});
