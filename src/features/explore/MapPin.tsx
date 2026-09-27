import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import AppIcon from '../../components/AppIcon';
import { categoryStyle } from '../../constants/Categories';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import type { MapItem } from '../../services/dataService';

interface MapPinProps {
  item: MapItem;
  size: number;
  selected?: boolean;
  /** Show the budget/rate tag (only at street-level zoom, to keep the map clean). */
  showPrice?: boolean;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}

/**
 * Round profile-picture pin. Ring colour = kind of work; a pointer tail marks a job
 * (someone needs help), a green dot marks an available provider (someone offering help).
 */
function MapPin({ item, size, selected, showPrice }: MapPinProps) {
  const cat = categoryStyle(item.skill);
  const s = Math.round(selected ? size * 1.22 : size);
  const ring = Math.max(2, Math.round(s * 0.085));
  const badge = Math.max(12, Math.round(s * 0.36));
  const isJob = item.kind === 'job';

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {selected ? (
        <View
          style={[
            styles.halo,
            { width: s + 16, height: s + 16, borderRadius: (s + 16) / 2, backgroundColor: cat.color, top: -8 },
          ]}
        />
      ) : null}
      <View
        style={[
          styles.circle,
          { width: s, height: s, borderRadius: s / 2, borderWidth: ring, borderColor: cat.color, backgroundColor: cat.soft },
        ]}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={{ width: s - ring * 2, height: s - ring * 2, borderRadius: s / 2 }} />
        ) : (
          <Text style={[styles.initials, { fontSize: s * 0.34, color: cat.color }]}>{initials(item.personName)}</Text>
        )}
      </View>

      {s >= 30 ? (
        <View
          style={[
            styles.badge,
            { width: badge, height: badge, borderRadius: badge / 2, backgroundColor: cat.color, right: -badge * 0.25, top: -badge * 0.15 },
          ]}>
          <AppIcon name={cat.icon} size={badge * 0.62} color={Colors.white} />
        </View>
      ) : null}

      {isJob ? (
        <View style={[styles.tail, { borderTopColor: cat.color, borderLeftWidth: s * 0.14, borderRightWidth: s * 0.14, borderTopWidth: s * 0.2 }]} />
      ) : (
        <View
          style={[
            styles.onlineDot,
            { width: s * 0.28, height: s * 0.28, borderRadius: s * 0.14, right: s * 0.02, top: s * 0.72 },
          ]}
        />
      )}

      {showPrice && item.price ? (
        <View style={[styles.price, { borderColor: cat.color }]}>
          <Text style={styles.priceText}>
            ₹{item.price}
            {item.priceUnit === 'hour' ? '/hr' : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default memo(MapPin);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  halo: { position: 'absolute', opacity: 0.3 },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  initials: { fontFamily: Fonts.bodyBold },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
    elevation: 7,
  },
  tail: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: Colors.white,
    elevation: 7,
  },
  price: {
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: 'rgba(15,23,42,0.92)',
  },
  priceText: { fontFamily: Fonts.bodyBold, fontSize: 10.5, color: Colors.white },
});
