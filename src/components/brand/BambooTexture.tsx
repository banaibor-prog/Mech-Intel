import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface BambooTextureProps {
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

// Three leaning culms with nodes and a few leaves, drawn once and anchored bottom-right
// like a watermark on handmade paper.
const STALKS = [
  { x: 118, lean: -14, w: 7 },
  { x: 136, lean: -6, w: 5.5 },
  { x: 150, lean: 4, w: 4.5 },
];
const LEAVES = [
  'M104 44 C 88 38, 74 40, 62 48 C 76 50, 90 50, 104 44 Z',
  'M112 70 C 96 72, 86 80, 80 92 C 94 88, 106 82, 112 70 Z',
  'M140 30 C 150 20, 164 16, 176 18 C 166 26, 154 30, 140 30 Z',
  'M146 58 C 158 54, 170 56, 180 62 C 168 66, 156 64, 146 58 Z',
  'M128 104 C 116 110, 108 120, 104 132 C 116 126, 124 118, 128 104 Z',
];

/** A quiet bamboo grove in the bottom-right corner of its parent. */
export default function BambooTexture({ color = Colors.bamboo, opacity = 0.12, style }: BambooTextureProps): React.JSX.Element {
  return (
    <Svg
      style={[StyleSheet.absoluteFill, style]}
      viewBox="0 0 180 200"
      preserveAspectRatio="xMaxYMax meet"
      opacity={opacity}
      pointerEvents="none">
      <G fill="none" stroke={color} strokeLinecap="round">
        {STALKS.map((s) => (
          <G key={s.x}>
            <Path d={`M${s.x} 200 L ${s.x + s.lean} 0`} strokeWidth={s.w} />
            {[40, 90, 140].map((y) => {
              const cx = s.x + (s.lean * (200 - y)) / 200;
              return <Path key={y} d={`M${cx - s.w} ${y} Q ${cx} ${y - 2.5} ${cx + s.w} ${y}`} strokeWidth={1.4} />;
            })}
          </G>
        ))}
      </G>
      <G fill={color}>
        {LEAVES.map((d) => (
          <Path key={d} d={d} />
        ))}
      </G>
    </Svg>
  );
}
