import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../constants/Colors';

interface AvatarProps {
  name: string;
  photoURL?: string;
  size?: number;
}

const PALETTE = ['#5B5FEF', '#1F9D55', '#C77B12', '#D8433D', '#2B2C32', '#0E8A8A'];

function colorForName(name: string) {
  const idx = name.charCodeAt(0) % PALETTE.length;
  return PALETTE[idx];
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

export default function Avatar({ name, photoURL, size = 48 }: AvatarProps) {
  if (photoURL) {
    return (
      <Image
        source={{ uri: photoURL }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorForName(name) },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsForName(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.surfaceAlt,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
  },
});
