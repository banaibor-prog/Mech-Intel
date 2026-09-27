import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';

interface ClusterPinProps {
  count: number;
  /** Colour of the most common category in the cluster. */
  color: string;
  size: number;
}

function ClusterPin({ count, color, size }: ClusterPinProps) {
  const s = Math.round(size * (1 + Math.min(0.6, Math.log10(count) * 0.45)));
  return (
    <View style={[styles.outer, { width: s + 12, height: s + 12, borderRadius: (s + 12) / 2, backgroundColor: color }]}>
      <View style={[styles.inner, { width: s, height: s, borderRadius: s / 2, borderColor: color }]}>
        <Text style={[styles.count, { fontSize: Math.max(11, s * 0.38) }]}>{count}</Text>
      </View>
    </View>
  );
}

export default memo(ClusterPin);

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center', opacity: 0.95 },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderWidth: 2,
    elevation: 6,
  },
  count: { fontFamily: Fonts.display, color: Colors.white },
});
