import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MeghalayaSky from '../brand/MeghalayaSky';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';

interface ScreenHeroProps {
  topInset: number;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Optional element on the right of the title (e.g. a button). */
  right?: React.ReactNode;
  children?: React.ReactNode;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Page header for tab screens: dusk over the Khasi hills behind an eyebrow, title and subtitle. */
export default function ScreenHero({ topInset, eyebrow, title, subtitle, right, children, height = 170, style }: ScreenHeroProps) {
  return (
    <View style={[styles.wrap, { paddingTop: topInset + 14, minHeight: topInset + height }, style]}>
      <MeghalayaSky animated={false} style={styles.backdrop} />
      <View style={styles.row}>
        <View style={styles.flex}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingBottom: 26, marginBottom: 14, overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  flex: { flex: 1 },
  eyebrow: { color: '#67E8F9', fontFamily: Fonts.bodyBold, fontSize: 10.5, letterSpacing: 2 },
  title: { color: Colors.white, fontFamily: Fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, marginTop: 2 },
  subtitle: { color: 'rgba(224,231,255,0.75)', fontFamily: Fonts.bodyMedium, fontSize: 13.5, lineHeight: 19, marginTop: 4, maxWidth: 300 },
});
