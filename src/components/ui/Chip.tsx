import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';
import AppIcon, { AppIconName } from '../AppIcon';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  /** Category colour: shown as a dot, and as the fill when active. */
  color?: string;
  icon?: AppIconName;
  style?: StyleProp<ViewStyle>;
}

export default function Chip({ label, active, onPress, color, icon, style }: ChipProps): React.JSX.Element {
  const activeBg = color ?? Colors.ink;
  const fg = active ? Colors.white : Colors.text;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, active ? { backgroundColor: activeBg, borderColor: activeBg } : null, style]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!active } : undefined}>
      {icon ? (
        <AppIcon name={icon} size={14} color={active ? Colors.white : color ?? Colors.textLight} />
      ) : color ? (
        <View style={[styles.dot, { backgroundColor: active ? Colors.white : color }]} />
      ) : null}
      <Text style={[styles.text, { color: fg }, (icon || color) && styles.textGap]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontFamily: Fonts.bodySemibold, fontSize: 12.5 },
  textGap: { marginLeft: 6 },
});
