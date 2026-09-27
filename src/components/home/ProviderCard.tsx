import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../Avatar';
import AppIcon from '../AppIcon';
import { AvailabilityBadge, TrustBadge, VerificationBadge } from './MarketplaceBadges';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { ProviderCard as ProviderCardModel } from '../../services/dataService';

function availabilityLabel(provider: ProviderCardModel): string {
  if (provider.availabilityStatus === 'availableNow') return 'Now';
  if (provider.availabilityStatus === 'availableThisWeek') return 'This week';
  return provider.available ? 'Today' : 'Busy';
}

export default function ProviderCard({ provider, onPress }: { provider: ProviderCardModel; onPress: () => void }) {
  const verified = !!provider.verifications?.length;
  const location = provider.location?.split(',')[0] || 'Near you';
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`View ${provider.displayName}'s profile`} style={styles.card} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.photoRow}>
        <View>
          <Avatar name={provider.displayName} photoURL={provider.photoURL} size={64} />
          {provider.available ? <View style={styles.onlineDot} /> : null}
        </View>
        <AvailabilityBadge label={availabilityLabel(provider)} />
      </View>
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>{provider.displayName}</Text>
        {verified ? <VerificationBadge /> : null}
      </View>
      <Text style={styles.skill} numberOfLines={1}>{provider.skills[0] || 'Service professional'}</Text>
      <View style={styles.reputationRow}>
        <View style={styles.rating}><AppIcon name="star" size={13} color={Colors.warning} filled /><Text style={styles.ratingText}>{provider.reviewCount ? provider.reviewAverage.toFixed(1) : 'New'}</Text></View>
        <TrustBadge score={provider.trustScore} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.rate}>{provider.hourlyRate ? `\u20B9${provider.hourlyRate}/hr` : 'Request quote'}</Text>
        <Text style={styles.distance} numberOfLines={1}>{location}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: 166, minHeight: 206, backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 13 },
  photoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  onlineDot: { position: 'absolute', right: 0, bottom: 2, width: 13, height: 13, borderRadius: 7, backgroundColor: Colors.success, borderWidth: 2.5, borderColor: Colors.surface },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 11 },
  name: { flexShrink: 1, color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 15 },
  skill: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: 3 },
  reputationRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 11 },
  footer: { marginTop: 'auto', paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  rate: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 12 },
  distance: { flexShrink: 1, color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 10, textAlign: 'right' },
});
