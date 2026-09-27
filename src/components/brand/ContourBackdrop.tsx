import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface ContourBackdropProps {
  /** Omit to fill the parent (with an absolute-fill style). */
  height?: number;
  style?: StyleProp<ViewStyle>;
}

// Offsets for the stacked contour lines, like a topographic map of the hills.
const LINES = [0, 14, 28, 42, 56, 70, 84];

/** Solid ink panel with faint topographic contour lines along the bottom. */
export default function ContourBackdrop({ height, style }: ContourBackdropProps) {
  return (
    <View style={[styles.wrap, { height }, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 320" preserveAspectRatio="xMidYMax slice" style={StyleSheet.absoluteFill}>
        <G fill="none" stroke="#FFFFFF" strokeWidth={1}>
          {LINES.map((dy, i) => (
            <Path
              key={dy}
              d={`M-20 ${214 + dy} C 40 ${196 + dy}, 90 ${190 + dy}, 150 ${204 + dy} S 260 ${230 + dy}, 320 ${206 + dy} S 400 ${188 + dy}, 430 ${198 + dy}`}
              strokeOpacity={0.05 + i * 0.012}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: Colors.ink },
});
