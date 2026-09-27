import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import GycLogo from './GycLogo';

interface GycLockupProps {
  logoSize?: number;
  /** Light text for use on dark or hero backgrounds. */
  inverted?: boolean;
  layout?: 'stacked' | 'inline';
  style?: StyleProp<ViewStyle>;
}

export default function GycLockup({
  logoSize = 96,
  inverted = false,
  layout = 'stacked',
  style,
}: GycLockupProps): React.JSX.Element {
  const inline = layout === 'inline';
  const titleSize = inline ? logoSize * 0.34 : logoSize * 0.3;
  return (
    <View style={[inline ? styles.inline : styles.stacked, style]}>
      <GycLogo size={logoSize} />
      <View style={inline ? styles.inlineText : styles.stackedText}>
        <Text style={[styles.title, { fontSize: titleSize, color: inverted ? Colors.white : Colors.text }]}>
          Got You Covered
        </Text>
        <Text
          style={[
            styles.tagline,
            { fontSize: Math.max(9, titleSize * 0.36), color: inverted ? 'rgba(255,255,255,0.8)' : Colors.textLight },
          ]}>
          TRUSTED LOCAL SERVICES
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stacked: { alignItems: 'center' },
  inline: { flexDirection: 'row', alignItems: 'center' },
  stackedText: { alignItems: 'center', marginTop: 10 },
  inlineText: { marginLeft: 10 },
  title: { fontFamily: Fonts.display, letterSpacing: -0.4 },
  tagline: { fontFamily: Fonts.bodySemibold, letterSpacing: 3, marginTop: 4 },
});
