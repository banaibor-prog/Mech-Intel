import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../Button';
import GycLogo from '../brand/GycLogo';
import BambooTexture from '../brand/BambooTexture';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';

export default function HomeEmptyState({ title, message, actionLabel, onAction }: { title: string; message: string; actionLabel: string; onAction: () => void }) {
  return (
    <View style={styles.container}>
      <BambooTexture opacity={0.1} />
      <GycLogo size={84} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title={actionLabel} onPress={onAction} size="sm" style={styles.action} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 22, borderWidth: 1, borderColor: Colors.border, padding: 24, alignItems: 'center', overflow: 'hidden' },
  title: { color: Colors.text, fontFamily: Fonts.display, fontSize: 17, marginTop: 14, textAlign: 'center' },
  message: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' },
  action: { marginTop: 16 },
});
