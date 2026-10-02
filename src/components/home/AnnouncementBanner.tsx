import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppIcon, { AppIconName } from '../AppIcon';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';
import { AnnouncementTone } from '../../types/models';

const TONES: Record<AnnouncementTone, { dot: string; icon: AppIconName }> = {
  info: { dot: Colors.accent, icon: 'bell' },
  warning: { dot: '#F59E0B', icon: 'fire' },
  success: { dot: Colors.success, icon: 'verified' },
};

/** App-wide notice set from the admin console. */
export default function AnnouncementBanner({ title, message, tone }: { title: string; message: string; tone: AnnouncementTone }) {
  const t = TONES[tone] ?? TONES.info;
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={[styles.stripe, { backgroundColor: t.dot }]} />
      <View style={styles.icon}>
        <AppIcon name={t.icon} size={16} color={Colors.text} />
      </View>
      <View style={styles.copy}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: Spacing.md,
    marginTop: 18,
    padding: 14,
    paddingLeft: 18,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  icon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14 },
  message: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, marginTop: 2 },
});
