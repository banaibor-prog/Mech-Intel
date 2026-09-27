import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** A coloured strip down the left edge (e.g. a work category colour). */
  accent?: string;
}

export default function Card({ children, style, accent }: CardProps): React.JSX.Element {
  return (
    <View style={[styles.card, style]}>
      {accent ? <View style={[styles.accent, { backgroundColor: accent }]} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
});
