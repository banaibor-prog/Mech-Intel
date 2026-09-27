import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../Avatar';
import AppIcon from '../AppIcon';
import { TrustBadge, VerificationBadge } from './MarketplaceBadges';
import { categoryStyle } from '../../constants/Categories';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { ProviderCard as ProviderCardModel } from '../../services/dataService';

function availabilityLabel(provider: ProviderCardModel): string {
  if (provider.availabilityStatus === 'availableNow') return 'Available now';
  if (provider.availabilityStatus === 'availableThisWeek') return 'This week';
  return provider.available ? 'Available today' : 'Busy';
}

export default function ProviderCard({ provider, onPress }: { provider: ProviderCardModel; onPress: () => void }) {
  const verified = !!provider.verifications?.length;
  const location = provider.location?.split(',')[0] || 'Near you';
  const cat = categoryStyle(provider.skills[0]);
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${provider.displayName}'s profile`} style={styles.card} onPress={onPress} activeOpacity={0.86}>
      <View style={[styles.top, { backgroundColor: cat.soft }]}>
        <View style={[styles.ring, { borderColor: cat.color }]}>
          <Avatar name={provider.displayName} photoURL={provider.photoURL} size={58} />
          {provider.available ? <View style={styles.onlineDot} /> : null}
        </View>
        <View style={[styles.catBadge, { backgroundColor: cat.color }]}>
          <AppIcon name={cat.icon} size={13} color={Colors.white} />
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {provider.displayName}
          </Text>
          {verified ? <VerificationBadge /> : null}
        </View>
        <Text style={[styles.skill, { color: cat.color }]} numberOfLines={1}>
          {provider.skills[0] || 'Service professional'}
        </Text>
        <View style={styles.reputationRow}>
          <View style={styles.rating}>
            <AppIcon name="star" size={12} color={Colors.warning} filled />
            <Text style={styles.ratingText}>{provider.reviewCount ? provider.reviewAverage.toFixed(1) : 'New'}</Text>
          </View>
          <TrustBadge score={provider.trustScore} />
        </View>
        <Text style={styles.availability}>{availabilityLabel(provider)}</Text>
        <View style={styles.footer}>
          <Text style={styles.rate}>{provider.hourlyRate ? `₹${provider.hourlyRate}/hr` : 'Quote'}</Text>
          <Text style={styles.distance} numberOfLines={1}>
            {location}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 172,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  top: { height: 74, alignItems: 'center', justifyContent: 'flex-end' },
  ring: { borderWidth: 3, borderRadius: 34, padding: 2, backgroundColor: Colors.white, marginBottom: -30 },
  onlineDot: { position: 'absolute', right: 1, bottom: 3, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2.5, borderColor: Colors.white },
  catBadge: { position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 12, paddingTop: 36, alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flexShrink: 1, color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14.5 },
  skill: { fontFamily: Fonts.bodySemibold, fontSize: 12, marginTop: 2 },
  reputationRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 9 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 11 },
  availability: { color: Colors.success, fontFamily: Fonts.bodySemibold, fontSize: 10.5, marginTop: 7 },
  footer: { alignSelf: 'stretch', marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  rate: { color: Colors.text, fontFamily: Fonts.display, fontSize: 13 },
  distance: { flexShrink: 1, color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 10.5, textAlign: 'right' },
});
