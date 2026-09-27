import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Typography';

interface SectionTitleProps {
  title: string;
  /** Small letter-spaced caps line above the title. */
  eyebrow?: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function SectionTitle({ title, eyebrow, action, onAction, style }: SectionTitleProps): React.JSX.Element {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.flex}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={10}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  flex: { flex: 1 },
  eyebrow: { fontFamily: Fonts.bodySemibold, fontSize: 10.5, letterSpacing: 2.2, color: Colors.accent, marginBottom: 3 },
  title: { fontFamily: Fonts.display, fontSize: 19, color: Colors.text, letterSpacing: -0.3 },
  action: { fontFamily: Fonts.bodySemibold, fontSize: 13, color: Colors.accent },
});
