import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../AppIcon';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';

interface Props {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, eyebrow, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? (
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowMark} />
            <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity accessibilityRole="button" onPress={onAction} style={styles.action} hitSlop={8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <View style={styles.actionIcon}>
            <AppIcon name="arrowRight" size={12} color={Colors.accent} />
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  copy: { flex: 1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  eyebrowMark: { width: 7, height: 7, transform: [{ rotate: '45deg' }], backgroundColor: Colors.bamboo, borderRadius: 1.5 },
  eyebrow: { color: Colors.bamboo, fontFamily: Fonts.bodyBold, fontSize: 10.5, letterSpacing: 1.8 },
  title: { color: Colors.text, fontFamily: Fonts.display, fontSize: 21, lineHeight: 26, letterSpacing: -0.5 },
  subtitle: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12.5, marginTop: 3 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 3 },
  actionText: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 12.5 },
  actionIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
