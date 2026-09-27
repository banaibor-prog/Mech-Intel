import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../AppIcon';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';

export default function HomeEmptyState({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel: string; onAction: () => void }) {
  return <View style={styles.container}><View style={styles.icon}><AppIcon name="briefcase" size={24} color={Colors.accent} /></View><Text style={styles.title}>{title}</Text><Text style={styles.message}>{message}</Text><TouchableOpacity accessibilityRole="button" style={styles.action} onPress={onAction}><Text style={styles.actionText}>{actionLabel}</Text></TouchableOpacity></View>;
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 24, alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.text, fontFamily: Fonts.displaySemibold, fontSize: 16, marginTop: 13, textAlign: 'center' },
  message: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' },
  action: { minHeight: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  actionText: { color: Colors.white, fontFamily: Fonts.bodyBold, fontSize: 13 },
});
