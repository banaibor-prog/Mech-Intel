import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon, { AppIconName } from '../../components/AppIcon';
import Button from '../../components/Button';
import GycLogo from '../../components/brand/GycLogo';
import ContourBackdrop from '../../components/brand/ContourBackdrop';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { signOut } from '../../services/authService';

interface Props {
  icon: AppIconName;
  title: string;
  message: string;
  supportEmail?: string;
}

/** Full-screen notice shown instead of the app (account suspended, maintenance). */
export default function NoticeScreen({ icon, title, message, supportEmail }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ContourBackdrop style={styles.backdrop} />
      <View style={[styles.content, { paddingTop: insets.top + Spacing.xl }]}>
        <GycLogo size={96} />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <AppIcon name={icon} size={22} color={Colors.text} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {supportEmail ? (
            <Button
              title={`Contact ${supportEmail}`}
              variant="outline"
              size="sm"
              onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
              style={styles.action}
            />
          ) : null}
          <Button title="Sign out" variant="ghost" size="sm" onPress={() => signOut()} style={styles.signOut} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.lg },
  card: {
    alignSelf: 'stretch',
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  iconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  title: { color: Colors.text, fontFamily: Fonts.display, fontSize: 21, marginTop: Spacing.md, textAlign: 'center' },
  message: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: 'center' },
  action: { marginTop: Spacing.lg, alignSelf: 'stretch' },
  signOut: { marginTop: Spacing.sm, alignSelf: 'stretch' },
});
