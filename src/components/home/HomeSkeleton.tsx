import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function HomeSkeleton() {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.9, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <View style={styles.screen}><Animated.View style={[styles.header, { opacity }]} /><View style={styles.actions}><Animated.View style={[styles.action, { opacity }]} /><Animated.View style={[styles.action, { opacity }]} /></View><View style={styles.cards}><Animated.View style={[styles.provider, { opacity }]} /><Animated.View style={[styles.provider, { opacity }]} /></View><Animated.View style={[styles.job, { opacity }]} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, padding: 16, paddingTop: 34 },
  header: { height: 104, borderRadius: 18, backgroundColor: Colors.surfaceAlt },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  action: { flex: 1, height: 44, borderRadius: 12, backgroundColor: Colors.surfaceAlt },
  cards: { flexDirection: 'row', gap: 10, marginTop: 38 },
  provider: { width: 166, height: 206, borderRadius: 18, backgroundColor: Colors.surfaceAlt },
  job: { height: 310, borderRadius: 18, backgroundColor: Colors.surfaceAlt, marginTop: 34 },
});
