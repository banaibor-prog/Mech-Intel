import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../AppIcon';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';

export default function SectionHeader({ title, subtitle, actionLabel, onAction }: { title: string; subtitle?: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.row}><View style={styles.copy}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{actionLabel && onAction ? <TouchableOpacity accessibilityRole="button" onPress={onAction} style={styles.action}><Text style={styles.actionText}>{actionLabel}</Text><AppIcon name="arrowRight" size={14} color={Colors.accent} /></TouchableOpacity> : null}</View>;
}

const styles = StyleSheet.create({
  row: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  copy: { flex: 1 },
  title: { color: Colors.text, fontFamily: Fonts.displaySemibold, fontSize: 17, lineHeight: 22 },
  subtitle: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 2 },
  action: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 8 },
  actionText: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 12 },
});
