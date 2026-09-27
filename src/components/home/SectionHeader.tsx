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
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity accessibilityRole="button" onPress={onAction} style={styles.action} hitSlop={8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <AppIcon name="arrowRight" size={14} color={Colors.accent} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  copy: { flex: 1 },
  eyebrow: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 12, marginBottom: 2 },
  title: { color: Colors.text, fontFamily: Fonts.display, fontSize: 19, lineHeight: 24, letterSpacing: -0.4 },
  subtitle: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12.5, marginTop: 3 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 2 },
  actionText: { color: Colors.accent, fontFamily: Fonts.bodySemibold, fontSize: 13 },
});
