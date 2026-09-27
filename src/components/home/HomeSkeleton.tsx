import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloudHills from '../brand/CloudHills';
import GycLoader from '../GycLoader';
import { Colors } from '../../constants/Colors';

export default function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <CloudHills height={insets.top + 200} />
      <GycLoader size={110} label="Finding work near you…" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  loader: { marginTop: 70 },
});
