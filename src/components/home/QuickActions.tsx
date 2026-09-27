import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppIcon from '../AppIcon';
import BambooTexture from '../brand/BambooTexture';
import { Colors, Gradients } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import { Spacing } from '../../constants/Spacing';

export default function QuickActions({ onPostJob, onOfferService }: { onPostJob: () => void; onOfferService: () => void }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity accessibilityRole="button" style={styles.flex} onPress={onPostJob} activeOpacity={0.88}>
        <LinearGradient colors={[...Gradients.brand]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.tile}>
          <View style={styles.iconOnDark}>
            <AppIcon name="plus" size={20} color={Colors.white} />
          </View>
          <Text style={styles.titleOnDark}>Post a job</Text>
          <Text style={styles.subOnDark}>Get help from pros nearby</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.flex} onPress={onOfferService} activeOpacity={0.88}>
        <View style={[styles.tile, styles.light]}>
          <BambooTexture opacity={0.16} />
          <View style={styles.iconOnLight}>
            <AppIcon name="briefcase" size={19} color={Colors.bamboo} />
          </View>
          <Text style={styles.title}>Offer a service</Text>
          <Text style={styles.sub}>Earn from work in your area</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.md, paddingTop: 4 },
  flex: { flex: 1 },
  tile: { borderRadius: 22, padding: 14, minHeight: 112, overflow: 'hidden' },
  light: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  iconOnDark: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  iconOnLight: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.bambooSoft, alignItems: 'center', justifyContent: 'center' },
  titleOnDark: { color: Colors.white, fontFamily: Fonts.display, fontSize: 16, marginTop: 12 },
  subOnDark: { color: 'rgba(255,255,255,0.82)', fontFamily: Fonts.body, fontSize: 11.5, marginTop: 2 },
  title: { color: Colors.text, fontFamily: Fonts.display, fontSize: 16, marginTop: 12 },
  sub: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 11.5, marginTop: 2 },
});
