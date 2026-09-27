import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContourBackdrop from '../brand/ContourBackdrop';
import GycLoader from '../GycLoader';
import { Colors } from '../../constants/Colors';

export default function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ContourBackdrop height={insets.top + 300} style={styles.sky} />
      <GycLoader size={110} label="Finding work near you…" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  sky: { borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  loader: { marginTop: 48 },
});
